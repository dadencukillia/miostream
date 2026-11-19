import type { FastifyReply, FastifyRequest } from "fastify";
import type * as dto from "./auth.dto";
import * as config from "@config";
import { AuthErrors } from "./auth.errors";
import * as authServices from "./auth.service";
import * as userServices from "@/api/user/user.shared";
import { cookieValue, setCookie } from "@utils/cookies";
import { OAuthProvider, type OAuthConfig } from "@utils/oauthProvider";
import { generateNickname } from "@utils/nickname";
import { UAParser } from "ua-parser-js";

// TODO: move it somewhere into config
const FRONTEND_SUCCESS_URL = "/";
const NONCE_COOKIE_NAME = "oauth_nonce";
const NONCE_MAX_AGE_SECONDS = 10 * 60;
const SESSION_COOKIE_NAME = "session_token";
const SESSION_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const OAUTH_STATE_SECRET = config.OAUTH_STATE_HMAC_SECRET;

export interface GoogleOAuthUserInfo {
    /** Unique Google Account ID (immutable) */
    sub: string;
    /** Full name of the user */
    name: string;
    /** First name */
    given_name: string;
    /** Last name */
    family_name: string;
    /** URL to the user's profile picture */
    picture: string;
    /** User's email address */
    email: string;
    /** Whether the email address has been verified by Google */
    email_verified: boolean;
    /** User's preferred locale (e.g., "en" or "uk") */
    locale?: string;
    /** Hosted Google Workspace domain (if applicable) */
    hd?: string;
}

// TODO: configure it better and move it somewhere into config
const oauthProviders: Record<string, { provider: OAuthProvider; config: OAuthConfig }> = {
    google: {
        provider: new OAuthProvider({
            slug: "google",
            authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
        }),
        config: {
            clientId: process.env.GOOGLE_CLIENT_ID ?? config.OAUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? config.OAUTH_CLIENT_SECRET,
            redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
            stateSecret: OAUTH_STATE_SECRET,
            scopes: ["openid", "email", "profile"],
        },
    },
};

const sanitizeFullName = (rawName?: string): string => {
    const cleaned = (rawName ?? "")
        .replace(/[^\p{L} '\u2019\u02BC.-]/gu, "")
        .replace(/^[^\p{L}]+|[^\p{L}.]+$/gu, "")
        .trim()
        .slice(0, 100);

    return cleaned.length >= 2 ? cleaned : "User";
};

const clearNonceCookie = (reply: FastifyReply) =>
    setCookie(reply, NONCE_COOKIE_NAME, "", {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: 0,
    });

export const redirectToProvider = async (
    request: FastifyRequest<{
        Querystring: dto.OAuthRedirectRequestQueriesType;
        Reply: dto.RedirectToProviderReturnType;
    }>,
    reply: FastifyReply<{
        Querystring: dto.OAuthRedirectRequestQueriesType;
        Reply: dto.RedirectToProviderReturnType;
    }>
) => {
    const entry = oauthProviders[request.query.provider];
    if (!entry) throw AuthErrors.error("oauth-unsupported-provider");

    const { url, nonce } = entry.provider.getAuthorizationUrl(entry.config);

    setCookie(reply, NONCE_COOKIE_NAME, nonce, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: NONCE_MAX_AGE_SECONDS,
    });

    return reply.status(302).header("Location", url);
};

export const oauthCallback = async (
    request: FastifyRequest<{
        Querystring: dto.OAuthCallbackRequestQueriesType;
        Reply: dto.OAuthCallbackReturnType;
    }>,
    reply: FastifyReply<{
        Querystring: dto.OAuthCallbackRequestQueriesType;
        Reply: dto.OAuthCallbackReturnType;
    }>
) => {
    const { code, state, error } = request.query;

    const nonce = cookieValue(request, NONCE_COOKIE_NAME);
    if (nonce) clearNonceCookie(reply);

    if (error) throw AuthErrors.error("oauth-missing-code").withDetails(error);
    if (!code) throw AuthErrors.error("oauth-missing-code");
    if (!state || !nonce) throw AuthErrors.error("oauth-invalid-state");

    const stateVerification = OAuthProvider.verifyState(state, nonce, { stateSecret: OAUTH_STATE_SECRET });
    if (!stateVerification.valid || !stateVerification.provider) throw AuthErrors.error("oauth-invalid-state");

    const entry = oauthProviders[stateVerification.provider];
    if (!entry) throw AuthErrors.error("oauth-unsupported-provider");

    let accessToken;
    let profile;

    try {
        accessToken = await entry.provider.exchangeCodeForToken(code, entry.config);
        profile = await entry.provider.getUserInfo<GoogleOAuthUserInfo>(accessToken);
    } catch (e) {
        throw AuthErrors.error("oauth-missing-code").withDetails(e);
    }

    if (!profile.sub || !profile.email || !profile.email_verified) {
        throw AuthErrors.error("oauth-invalid-state").withDetails("unverified or incomplete provider profile");
    }

    let user;

    user = await userServices.getUserByGoogleId(request.server.pg, profile.sub).catch((e: any) => {
        if (e?.slug === "user-not-found") return null;
        throw e;
    });
    if (!user) {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                user = await userServices.createUser(request.server.pg, {
                    googleId: profile.sub,
                    email: profile.email,
                    nickname: generateNickname(),
                    fullName: sanitizeFullName(profile.name),
                });
                break;
            } catch (e: any) {
                if (e?.slug !== "user-nickname-already-taken" || attempt === 2) throw e;
            }
        }
    }

    if (!user || user.userStatus !== "active") {
        throw AuthErrors.error("auth-no-session-access");
    }

    // Tell modern browsers to send the device model on future requests
    reply.header("Accept-CH", "Sec-CH-UA-Model, Sec-CH-UA-Platform");

    const parser = new UAParser(request.headers["user-agent"]);
    const { browser, os, device } = parser.getResult();

    const chModelHeader = request.headers["sec-ch-ua-model"];
    const chModel = typeof chModelHeader === "string"
        ? chModelHeader.replace(/^"|"$/g, "").trim()
        : undefined;

    // Common parsing
    const deviceModel = chModel || device.model;
    const deviceName = [device.vendor, deviceModel].filter(Boolean).join(" ") || undefined;
    const deviceType = device.type ?? (os.name || browser.name ? "desktop" : undefined);
    const osName = [os.name, os.version].filter(Boolean).join(" ") || undefined;
    const majorVersion = browser.version?.split(".")[0];
    const browserName = [browser.name, majorVersion].filter(Boolean).join(" ") || undefined;

    const session = await authServices.newUserSession(request.server.pg, user.userId, {
        deviceType,
        deviceName,
        os: osName,
        browser: browserName,
        ipAddress: request.ip || undefined,
    });

    setCookie(reply, SESSION_COOKIE_NAME, session.sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: "/api/auth/accessToken",
    });

    return reply.redirect(FRONTEND_SUCCESS_URL, 302);
};

export const accessToken = async (
    _request: FastifyRequest<{
        Reply: dto.AccessTokenReturnType;
    }>,
    _reply: FastifyReply<{
        Reply: dto.AccessTokenReturnType;
    }>
) => {
    throw AuthErrors.error("not-implemented").withDetails("access token");
};
