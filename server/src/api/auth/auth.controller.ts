import type { FastifyReply, FastifyRequest } from "fastify";
import type * as dto from "./auth.dto";
import { AuthErrors } from "./auth.errors";

export const redirectToProvider = async (
    _request: FastifyRequest<{
        Querystring: dto.OAuthRedirectRequestQueriesType;
        Reply: dto.RedirectToProviderReturnType;
    }>,
    _reply: FastifyReply<{
        Querystring: dto.OAuthRedirectRequestQueriesType;
        Reply: dto.RedirectToProviderReturnType;
    }>
) => {
    throw AuthErrors.error("not-implemented").withDetails("oauth redirect");
};

export const oauthCallback = async (
    _request: FastifyRequest<{
        Querystring: dto.OAuthCallbackRequestQueriesType;
        Reply: dto.OAuthCallbackReturnType;
    }>,
    _reply: FastifyReply<{
        Querystring: dto.OAuthCallbackRequestQueriesType;
        Reply: dto.OAuthCallbackReturnType;
    }>
) => {
    throw AuthErrors.error("not-implemented").withDetails("oauth callback");
};

export const accessToken = async (
    _request: FastifyRequest<{
        Body: dto.AccessTokenRequestPayloadType;
        Reply: dto.AccessTokenReturnType;
    }>,
    _reply: FastifyReply<{
        Body: dto.AccessTokenRequestPayloadType;
        Reply: dto.AccessTokenReturnType;
    }>
) => {
    throw AuthErrors.error("not-implemented").withDetails("access token");
};