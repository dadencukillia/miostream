import type { FastifyReply, FastifyRequest } from "fastify";
import type * as dto from "./auth.dto";
import * as config from "@config";
import { AuthErrors } from "./auth.errors";
import * as authServices from "./auth.service";
import * as userServices from "@/api/user/user.shared";
import { cookieValue, setCookie } from "@utils/cookies";
import { OAuthProvider, type OAuthConfig } from "@utils/oauthProvider";
import { generateNickname } from "@utils/nickname";

// TODO: move it somewhere into config
const FRONTEND_SUCCESS_URL = "/";
const NONCE_COOKIE_NAME = "oauth_nonce";
const NONCE_MAX_AGE_SECONDS = 10 * 60;
const SESSION_COOKIE_NAME = "session_token";
const SESSION_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const OAUTH_STATE_SECRET = config.OAUTH_STATE_HMAC_SECRET as unknown as string;

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

    return reply.status(302).header("Location", url).send(undefined);
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

    if (error) {
        clearNonceCookie(reply);
        throw AuthErrors.error("oauth-missing-code").withDetails(error);
    }
    if (!code) throw AuthErrors.error("oauth-missing-code");
    if (!state) throw AuthErrors.error("oauth-invalid-state");

    const nonce = cookieValue(request, NONCE_COOKIE_NAME);
    if (!nonce) throw AuthErrors.error("oauth-invalid-state");

    clearNonceCookie(reply);

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

    let user;

    user = await userServices.getUserByGoogleId(request.server.pg, profile.sub).catch((e: any) => {
        if (e?.slug === "user-not-found") return null;
        throw e;
    });
    if (!user) user = await userServices.createUser(request.server.pg, {
        googleId: profile.sub,
        email: profile.email,
        nickname: generateNickname(),
        fullName: profile.name?.trim() || "User"
    });

    if (!user || user.userStatus !== "active") {
        throw AuthErrors.error("auth-no-session-access");
    }

    // TODO: add user-agent parsing to give it into session
    const session = await authServices.newUserSession(request.server.pg, user.userId, { ipAddress: request.ip });

    setCookie(reply, SESSION_COOKIE_NAME, session.sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return reply.status(302).redirect(FRONTEND_SUCCESS_URL);
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
