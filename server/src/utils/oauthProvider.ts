import { timingSafeEqual } from "node:crypto";

/**
 * Static endpoint URLs and identifier describing an OAuth 2.0 provider.
 */
export interface OAuthEndpoints {
    slug: string;
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
}

/**
 * Client credentials and runtime parameters required to communicate with an OAuth 2.0 provider.
 */
export interface OAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    stateSecret: string;
    /** Optional list of OAuth scopes requested from the user. */
    scopes?: string[];
}

/**
 * Result of generating an OAuth authorization redirect URL.
 */
export interface AuthUrlResult {
    url: string;
    nonce: string;
}

/**
 * Result of verifying an incoming OAuth callback `state` parameter.
 */
export interface VerifyStateResult {
    valid: boolean;
    provider: string | null;
}

/**
 * Stateless OAuth 2.0 client adapter for handling Authorization Code flow interactions.
 *
 * @remarks
 * Stores only provider endpoint URLs and slug internally. Client credentials and secrets
 * are passed per method call via {@link OAuthConfig}.
 */
export class OAuthProvider {
    private readonly slug: string;
    private readonly authorizationUrl: string;
    private readonly tokenUrl: string;
    private readonly userInfoUrl: string;

    constructor(endpoints: OAuthEndpoints) {
        if (endpoints.slug.trim().length === 0 || endpoints.slug.includes("_")) {
            throw new Error("OAuth provider slug must be non-empty and must not contain '_'");
        }

        this.slug = endpoints.slug;
        this.authorizationUrl = endpoints.authorizationUrl;
        this.tokenUrl = endpoints.tokenUrl;
        this.userInfoUrl = endpoints.userInfoUrl;
    }

    /**
     * Computes an HMAC-SHA512 signature for the `${provider}_${nonce}` payload.
     */
    private static signPayload(provider: string, nonce: string, secret: string): string {
        return new Bun.CryptoHasher("sha512", secret)
            .update(`${provider}_${nonce}`)
            .digest("hex");
    }

    /**
     * Generates a redirect URL to the provider's login form with a cryptographic nonce.
     */
    public getAuthorizationUrl(config: OAuthConfig): AuthUrlResult {
        // 32 cryptographically random bytes -> 44 characters in Base64
        const randomBytes = crypto.getRandomValues(new Uint8Array(32));
        const nonce = randomBytes.toBase64();

        const signature = OAuthProvider.signPayload(this.slug, nonce, config.stateSecret);
        const state = `${this.slug}_${signature}`;

        const url = new URL(this.authorizationUrl);
        url.searchParams.set("client_id", config.clientId);
        url.searchParams.set("redirect_uri", config.redirectUri);
        url.searchParams.set("response_type", "code");
        url.searchParams.set("state", state);

        if (config.scopes && config.scopes.length > 0) {
            url.searchParams.set("scope", config.scopes.join(" "));
        }

        return {
            url: url.toString(),
            nonce,
        };
    }

    /**
     * Statically verifies the state parameter against the stored nonce.
     * Returns whether the signature is valid along with the provider slug extracted from the state.
     */
    public static verifyState(
        state: string,
        nonce: string,
        config: Pick<OAuthConfig, "stateSecret">
    ): VerifyStateResult {
        if (!state || !nonce) {
            return { valid: false, provider: null };
        }

        const separatorIndex = state.indexOf("_");
        if (separatorIndex <= 0) {
            return { valid: false, provider: null };
        }

        const provider = state.slice(0, separatorIndex);
        const actualSignature = state.slice(separatorIndex + 1);
        const expectedSignature = OAuthProvider.signPayload(provider, nonce, config.stateSecret);

        const actualBuf = Buffer.from(actualSignature, "utf8");
        const expectedBuf = Buffer.from(expectedSignature, "utf8");

        // timingSafeEqual throws a RangeError if buffer lengths differ
        if (actualBuf.length !== expectedBuf.length) {
            return { valid: false, provider: null };
        }

        const isValid = timingSafeEqual(actualBuf, expectedBuf);
        return {
            valid: isValid,
            provider: isValid ? provider : null,
        };
    }

    /**
     * Exchanges a temporary authorization code for an access_token with the provider.
     */
    public async exchangeCodeForToken(code: string, config: OAuthConfig): Promise<string> {
        const body = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.redirectUri,
            code,
        });

        const response = await fetch(this.tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            body: body.toString(),
        });

        if (!response.ok) {
            throw new Error(`OAuth token exchange failed (${this.slug}): ${response.status}`);
        }

        const data = (await response.json()) as { access_token?: string };
        if (!data.access_token) {
            throw new Error(`OAuth token response missing access_token (${this.slug})`);
        }

        return data.access_token;
    }

    /**
     * Fetches user profile data using the provided access_token.
     */
    public async getUserInfo<T = Record<string, unknown>>(accessToken: string): Promise<T> {
        const response = await fetch(this.userInfoUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`OAuth user info fetch failed (${this.slug}): ${response.status}`);
        }

        return (await response.json()) as T;
    }
}
