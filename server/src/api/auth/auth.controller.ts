import type { FastifyReply, FastifyRequest } from "fastify";
import type * as dto from "./auth.dto";
import * as config from "@config";
import { AuthErrors } from "./auth.errors";
import { OAuthProvider } from "@utils/oauthProvider";
import { setCookie } from "@utils/cookies";

const OAUTH_NONCE_COOKIE = "oauth_nonce";
const OAUTH_NONCE_MAX_AGE_SECONDS = 10 * 60;

const providers = new Map<string, OAuthProvider>([
  ["google", new OAuthProvider({
    slug: "google",
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
  })],
]);

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
    const provider = providers.get(request.query.provider);
    if (!provider) throw AuthErrors.error("oauth-unsupported-provider");

    const { url, nonce } = provider.getAuthorizationUrl({
        clientId: config.OAUTH_CLIENT_ID,
        clientSecret: config.OAUTH_CLIENT_SECRET,
        redirectUri: config.OAUTH_REDIRECT_URI,
        stateSecret: config.OAUTH_STATE_HMAC_SECRET as unknown as string,
    });

    setCookie(reply, OAUTH_NONCE_COOKIE, nonce, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: OAUTH_NONCE_MAX_AGE_SECONDS,
    });

    return reply.status(302).header("Location", url).send(undefined);
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
        Reply: dto.AccessTokenReturnType;
    }>,
    _reply: FastifyReply<{
        Reply: dto.AccessTokenReturnType;
    }>
) => {
    throw AuthErrors.error("not-implemented").withDetails("access token");
};