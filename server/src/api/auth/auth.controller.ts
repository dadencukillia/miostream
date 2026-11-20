import type { FastifyReply, FastifyRequest } from "fastify";
import type * as dto from "./auth.dto";
import * as config from "@config";
import { AuthErrors } from "./auth.errors";
import * as oauthProviderServices from "./services/oauthProvider.service";
import * as tokenServices from "./services/token.service";
import * as sessionServices from "./services/session.service";
import { cookieValue, setCookie } from "@utils/cookies";

// Helpers

const setNonceCookie = (reply: FastifyReply, nonce: string, maxAge: number) =>
    setCookie(reply, config.AuthAdjustments.OAUTH_NONCE_COOKIE_NAME, nonce, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: maxAge,
        path: config.AuthAdjustments.OAUTH_NONCE_COOKIE_PATH,
    });

const setSessionCookie = (reply: FastifyReply, sessionToken: string) =>
    setCookie(reply, config.AuthAdjustments.SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: config.AuthAdjustments.SESSION_MAX_AGE_SECONDS,
        path: config.AuthAdjustments.SESSION_COOKIE_PATH,
    });

// Controllers

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
    const { url, nonce } = oauthProviderServices.createOAuthAuthorization(request.query.provider);

    setNonceCookie(reply, nonce, config.AuthAdjustments.OAUTH_NONCE_MAX_AGE_SECONDS);

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
    if (nonce) setNonceCookie(reply, "", 0);

    if (error) throw AuthErrors.error("oauth-missing-code").withDetails(error);
    if (!code) throw AuthErrors.error("oauth-missing-code");
    if (!state || !nonce) throw AuthErrors.error("oauth-invalid-state");

    const { userId } = await oauthProviderServices.authenticateOAuthCallback(
        request.server.pg,
        state,
        nonce,
        code
    );

    const metadata = oauthProviderServices.parseClientMetadata(request.headers, request.ip);
    const session = await sessionServices.newUserSession(request.server.pg, userId, metadata);

    setSessionCookie(reply, session.sessionToken);

    return reply.redirect(config.AuthAdjustments.SUCCESS_REDIRECT_URL, 302);
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

    const session = await sessionServices.useRefreshToken(
        request.server.pg,
        sessionToken
    );

    const accessToken = await tokenServices.generateAccessToken(
        session.sessionId,
        session.userId
    );

    if (session.rotated && session.newSessionToken) {
        setSessionCookie(reply, session.newSessionToken);
    }

    return reply.send({
        ok: true,
        accessToken,
        tokenType: "Bearer",
    });
};

export const logout = async (
    request: FastifyRequest<{
        Querystring: dto.LogoutRequestQueriesType;
        Reply: null
    }>,
    reply: FastifyReply<{
        Querystring: dto.LogoutRequestQueriesType;
        Reply: null
    }>
) => {
    if (!request.auth) return;
    await request.auth.logout(request, reply);
    return reply.status(302).header("Location", request.query.redirect ?? "/");
}
