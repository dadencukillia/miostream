import type { FastifyReply, FastifyRequest } from "fastify";
import type * as dto from "./auth.dto";
import * as config from "@config";
import { AuthErrors } from "./auth.errors";
import * as authServices from "./auth.service";
import { cookieValue, setCookie } from "@utils/cookies";

const setNonceCookie = (reply: FastifyReply, nonce: string) =>
    setCookie(reply, config.AuthAdjustments.OAUTH_NONCE_COOKIE_NAME, nonce, {
        httpOnly: true,
        secure: config.COOKIE_SECURE,
        sameSite: "Lax",
        maxAge: config.AuthAdjustments.OAUTH_NONCE_MAX_AGE_SECONDS,
        path: config.AuthAdjustments.OAUTH_NONCE_COOKIE_PATH,
    });

const clearNonceCookie = (reply: FastifyReply) =>
    setCookie(reply, config.AuthAdjustments.OAUTH_NONCE_COOKIE_NAME, "", {
        httpOnly: true,
        secure: config.COOKIE_SECURE,
        sameSite: "Lax",
        maxAge: 0,
        path: config.AuthAdjustments.OAUTH_NONCE_COOKIE_PATH,
    });

const setSessionCookie = (reply: FastifyReply, sessionToken: string) =>
    setCookie(reply, config.AuthAdjustments.SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: config.COOKIE_SECURE,
        sameSite: "Strict",
        maxAge: config.AuthAdjustments.SESSION_MAX_AGE_SECONDS,
        path: config.AuthAdjustments.SESSION_COOKIE_PATH,
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
    const { url, nonce } = authServices.createOAuthAuthorization(request.query.provider);

    setNonceCookie(reply, nonce);

    reply
        .header("Accept-CH", "Sec-CH-UA-Model, Sec-CH-UA-Platform")
        .header("Critical-CH", "Sec-CH-UA-Model, Sec-CH-UA-Platform");

    return reply.redirect(url, 302);
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

    const nonce = cookieValue(request, config.AuthAdjustments.OAUTH_NONCE_COOKIE_NAME);
    if (nonce) clearNonceCookie(reply);

    if (error) throw AuthErrors.error("oauth-missing-code").withDetails(error);
    if (!code) throw AuthErrors.error("oauth-missing-code");
    if (!state || !nonce) throw AuthErrors.error("oauth-invalid-state");

    const { userId } = await authServices.authenticateOAuthCallback(
        request.server.pg,
        state,
        nonce,
        code
    );

    const metadata = authServices.parseClientMetadata(request.headers, request.ip);
    const session = await authServices.newUserSession(request.server.pg, userId, metadata);

    setSessionCookie(reply, session.sessionToken);

    return reply.redirect(config.FRONTEND_URL, 302);
};

export const accessToken = async (
    request: FastifyRequest<{
        Reply: dto.AccessTokenReturnType;
    }>,
    reply: FastifyReply<{
        Reply: dto.AccessTokenReturnType;
    }>
) => {
    const sessionToken = cookieValue(request, config.AuthAdjustments.SESSION_COOKIE_NAME);
    if (!sessionToken) throw AuthErrors.error("auth-no-session-access");

    const session = await authServices.useRefreshToken(
        request.server.pg,
        sessionToken
    );

    const token = await authServices.generateAccessToken(
        session.sessionId,
        session.userId
    );

    if (session.rotated && session.newSessionToken) {
        setSessionCookie(reply, session.newSessionToken);
    }

    return reply.send({
        ok: true,
        accessToken: token,
        tokenType: "Bearer",
    });
};
