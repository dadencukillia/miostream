import type { FastifyReply, FastifyRequest } from "fastify";
import type * as dto from "./auth.dto";
import * as services from "./auth.service";

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
    const { url, provider } = services.buildOAuthRedirect(request.query.provider);

    return reply.status(302).header("Location", url).send({ ok: true, provider });
};

export const exchangeToken = async (
    request: FastifyRequest<{
        Body: dto.ExchangeTokenRequestPayloadType;
        Reply: dto.ExchangeTokenReturnType;
    }>,
    reply: FastifyReply<{
        Body: dto.ExchangeTokenRequestPayloadType;
        Reply: dto.ExchangeTokenReturnType;
    }>
) => {
    const result = await services.exchangeOAuthToken(request.body);

    return reply.status(200).send({ ok: true, ...result });
};