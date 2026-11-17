import { AUTH_JWT_SECRET } from "@config";
import { OAuthProvider, type OAuthConfig } from "@utils/oauthProvider";
import type * as dto from "./auth.dto";
import { AuthErrors } from "./auth.errors";

export interface OAuthRedirectResult {
    url: string;
    provider: string;
}

export interface OAuthTokenResult {
    accessToken: string;
    tokenType: "Bearer";
    provider: string;
}

const OAUTH_AUTHORIZATION_URL = process.env.OAUTH_AUTHORIZATION_URL ?? "http://localhost/oauth/authorize";
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI ?? "";
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID ?? "";
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET ?? "";
const OAUTH_TOKEN_URL = process.env.OAUTH_TOKEN_URL ?? "";
const OAUTH_USER_INFO_URL = process.env.OAUTH_USER_INFO_URL ?? "";

const getOAuthConfig = (): OAuthConfig => ({
    clientId: OAUTH_CLIENT_ID,
    clientSecret: OAUTH_CLIENT_SECRET,
    redirectUri: OAUTH_REDIRECT_URI,
    stateSecret: AUTH_JWT_SECRET,
    scopes: ["openid", "email", "profile"],
});

const createOAuthProvider = (providerSlug: string): OAuthProvider => new OAuthProvider({
    slug: providerSlug,
    authorizationUrl: OAUTH_AUTHORIZATION_URL,
    tokenUrl: OAUTH_TOKEN_URL,
    userInfoUrl: OAUTH_USER_INFO_URL,
});

const getProviderSlugFromState = (state: string): string | null => {
    const separatorIndex = state.indexOf("_");
    return separatorIndex > 0 ? state.slice(0, separatorIndex) : null;
};

const resolveProviderSlug = (query: { code?: string; state: string }): string => {
    if (!query.code) {
        throw AuthErrors.error("oauth-missing-code");
    }

    const provider = getProviderSlugFromState(query.state);
    if (!provider) {
        throw AuthErrors.error("oauth-invalid-state");
    }

    return provider;
};

export const buildOAuthRedirect = (providerSlug: string): OAuthRedirectResult => {
    const provider = providerSlug.trim().toLowerCase();
    const { url } = createOAuthProvider(provider).getAuthorizationUrl(getOAuthConfig());

    return { url, provider };
};

export const exchangeOAuthToken = async (payload: dto.ExchangeTokenRequestPayloadType): Promise<OAuthTokenResult> => {
    const provider = resolveProviderSlug(payload);
    let accessToken: string;

    try {
        accessToken = await createOAuthProvider(provider).exchangeCodeForToken(payload.code, getOAuthConfig());
    } catch {
        throw AuthErrors.error("oauth-token-exchange-failed");
    }

    return { accessToken, tokenType: "Bearer", provider };
};