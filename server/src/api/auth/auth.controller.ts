import type { FastifyReply, FastifyRequest } from "fastify";
import type * as dto from "./auth.dto";
import * as config from "@config";
import { AuthErrors } from "./auth.errors";
import * as credentialsServices from "./services/credentials.service";
import * as oauthProviderServices from "./services/oauthProvider.service";
import * as tokenServices from "./services/token.service";
import * as sessionServices from "./services/session.service";
import { cookieValue, setCookie } from "@utils/cookies";
import { transformOk } from "@utils/transformers";
import { deleteSessionById } from "@sqlc/sessions_sql";

// Helpers

const setNonceCookie = (reply: FastifyReply, nonce: string, maxAge: number) =>
    setCookie(reply, config.AuthAdjustments.OAUTH_NONCE_COOKIE_NAME, nonce, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: maxAge,
        path: "/api/auth/callback",
    });

const setSessionCookie = (reply: FastifyReply, sessionToken: string, maxAge: number) =>
    setCookie(reply, config.AuthAdjustments.SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: maxAge,
        path: "/api/auth/session",
    });

// Controllers

export const register = async (
    request: FastifyRequest<{
        Body: dto.RegisterRequestPayloadType;
        Reply: dto.RegisterReturnType;
    }>,
    reply: FastifyReply<{
        Body: dto.RegisterRequestPayloadType;
        Reply: dto.RegisterReturnType;
    }>
) => {
    const user = await credentialsServices.registerUser(request.server.pg, request.body);

    const metadata = oauthProviderServices.parseClientMetadata(request.headers, request.ip);
    const session = await sessionServices.newUserSession(request.server.pg, user.userId, metadata);

    setSessionCookie(reply, session.sessionToken, config.AuthAdjustments.SESSION_MAX_AGE_SECONDS);

    return reply.status(201).send(transformOk(user));
};

export const login = async (
    request: FastifyRequest<{
        Body: dto.LoginRequestPayloadType;
        Reply: dto.LoginReturnType;
    }>,
    reply: FastifyReply<{
        Body: dto.LoginRequestPayloadType;
        Reply: dto.LoginReturnType;
    }>
) => {
    const user = await credentialsServices.loginUser(request.server.pg, request.body);

    const metadata = oauthProviderServices.parseClientMetadata(request.headers, request.ip);
    const session = await sessionServices.newUserSession(request.server.pg, user.userId, metadata);

    setSessionCookie(reply, session.sessionToken, config.AuthAdjustments.SESSION_MAX_AGE_SECONDS);

    return reply.status(200).send(transformOk(user));
};

export const updatePassword = async (
    request: FastifyRequest<{
        Body: dto.UpdatePasswordRequestPayloadType;
        Reply: dto.UpdatePasswordReturnType;
    }>,
    reply: FastifyReply<{
        Body: dto.UpdatePasswordRequestPayloadType;
        Reply: dto.UpdatePasswordReturnType;
    }>
) => {
    await credentialsServices.updateUserPassword(
        request.server.pg,
        request.auth!.userId,
        request.body
    );

    return reply.status(204).send(null);
};

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

    setSessionCookie(reply, session.sessionToken, config.AuthAdjustments.SESSION_MAX_AGE_SECONDS);

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
        setSessionCookie(reply, session.newSessionToken, config.AuthAdjustments.SESSION_MAX_AGE_SECONDS);
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
    const redirect = () => reply.redirect(request.query.redirect ?? "/", 302);

    const sessionToken = cookieValue(request, config.AuthAdjustments.SESSION_COOKIE_NAME);
    if (!sessionToken) return redirect();

    const { sessionId } = await sessionServices.useRefreshToken(request.server.pg, sessionToken, {
        tokenRotationMillis: -1
    });

    try {
        await deleteSessionById(request.server.pg, { sessionId: sessionId.toString() });
    } catch (e) {
        throw AuthErrors
            .error("auth-db-failed")
            .withDetails(e);
    }

    setSessionCookie(reply, "", 0);

    // TODO: make denylist in Redis

    return redirect();
}
