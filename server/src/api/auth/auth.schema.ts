import { Type } from "typebox";
import { ErrorResponse } from "@utils/errorsCollection";

export const TAG_AUTH = "Auth";

// Provider slug is encoded as the state prefix; '_' is the separator.
export const OAUTH_PROVIDER_PATTERN = "^[a-z][a-z0-9-]*$";

// Requests

export const OAuthRedirectRequestQueries = Type.Object({
    provider: Type.String({
        pattern: OAUTH_PROVIDER_PATTERN,
        description: "Provider slug. No per-provider endpoints: it is encoded into the state.",
        examples: ["google"],
    }),
}, {
    additionalProperties: false,
});

export const OAuthCallbackRequestQueries = Type.Object({
    code: Type.Optional(Type.String({
        minLength: 1,
        description: "Authorization code returned by the provider",
    })),
    state: Type.Optional(Type.String({
        minLength: 1,
        description: "Opaque state; its prefix identifies the provider",
        examples: ["google_9f2c..."],
    })),
    error: Type.Optional(Type.String({
        minLength: 1,
        description: "Error code reported by the provider",
    })),
}, {
    additionalProperties: false,
    description: "Single callback for every provider",
});

export const AccessTokenRequestPayload = Type.Object({
    state: Type.String({
        minLength: 1,
        description: "State from the OAuth flow; its prefix identifies the provider",
        examples: ["google_9f2c..."],
    }),
}, {
    additionalProperties: false,
    description: "Provider is resolved from the state, not from a dedicated endpoint",
});

// Responses

export const OAuthRedirectResponse = Type.Object({
    ok: Type.Literal(true),
}, {
    additionalProperties: false,
    description: "Target URL is returned in the Location header",
});

export const OAuthCallbackResponse = Type.Object({
    ok: Type.Literal(true),
}, {
    additionalProperties: false,
});

export const AccessTokenResponse = Type.Object({
    ok: Type.Literal(true),
    accessToken: Type.String({ description: "Application access token" }),
    tokenType: Type.Literal("Bearer"),
}, {
    additionalProperties: false,
});

// Route schemas

export const RedirectToProviderSchema = {
    tags: [TAG_AUTH],
    summary: "Redirect to OAuth provider",
    description: "Generic redirect: the provider is passed as a slug and encoded into the state.",
    querystring: OAuthRedirectRequestQueries,
    response: { 302: OAuthRedirectResponse, 400: ErrorResponse, 500: ErrorResponse },
} as const;

export const OAuthCallbackSchema = {
    tags: [TAG_AUTH],
    summary: "OAuth provider callback",
    description: "Single callback for all providers; the provider is taken from the state.",
    querystring: OAuthCallbackRequestQueries,
    response: { 200: OAuthCallbackResponse, 400: ErrorResponse, 501: ErrorResponse },
} as const;

export const AccessTokenSchema = {
    tags: [TAG_AUTH],
    summary: "Get access token",
    description: "Returns an application access token; the provider is taken from the state.",
    body: AccessTokenRequestPayload,
    response: { 200: AccessTokenResponse, 400: ErrorResponse, 501: ErrorResponse },
} as const;