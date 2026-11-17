import Type from "typebox";
import { ErrorResponse } from "@utils/errorsCollection";

export const TAG_AUTH = "Auth";

export const OAuthRedirectRequestQueries = Type.Object({
    provider: Type.String({
        pattern: "^[a-z][a-z0-9_-]*$",
        description: "Any OAuth provider slug; it is encoded into the state and resolved back from it",
        examples: ["google", "github", "discord"],
    }),
}, {
    additionalProperties: false,
});

export const OAuthRedirectResponse = Type.Object({
    ok: Type.Literal(true, { description: "Indicates a successful operation" }),
    provider: Type.String({
        description: "OAuth provider slug used for this redirect",
        examples: ["google"],
    }),
}, {
    additionalProperties: false,
    description: "OAuth redirect stub response; the target URL is provided in the Location header",
});

export const ExchangeTokenRequestPayload = Type.Object({
    code: Type.String({
        minLength: 1,
        description: "Authorization code returned by the provider",
    }),
    state: Type.String({
        minLength: 1,
        description: "Opaque state value; its prefix identifies the OAuth provider",
        examples: ["google_9f2c..."],
    }),
}, {
    additionalProperties: false,
});

export const TokenResponse = Type.Object({
    ok: Type.Literal(true, { description: "Indicates a successful operation" }),
    accessToken: Type.String({ description: "OAuth access token" }),
    tokenType: Type.Literal("Bearer", { description: "Access token type" }),
    provider: Type.String({
        description: "OAuth provider slug extracted from state",
        examples: ["google"],
    }),
}, {
    additionalProperties: false,
    description: "OAuth access token response",
});

export const RedirectToProviderSchema = {
    tags: [TAG_AUTH],
    summary: "Redirect to OAuth provider",
    description: "Builds an authorization URL for the requested provider and redirects the client to its login form. The provider slug is encoded into the OAuth state.",
    querystring: OAuthRedirectRequestQueries,
    response: {
        302: OAuthRedirectResponse,
        400: ErrorResponse,
        500: ErrorResponse,
    },
} as const;

export const ExchangeTokenSchema = {
    tags: [TAG_AUTH],
    summary: "Exchange OAuth code for access token",
    description: "Generic access token stub. The provider is resolved from the state parameter.",
    body: ExchangeTokenRequestPayload,
    response: {
        200: TokenResponse,
        400: ErrorResponse,
        500: ErrorResponse,
        502: ErrorResponse,
    },
} as const;