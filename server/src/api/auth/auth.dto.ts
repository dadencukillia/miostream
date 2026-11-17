import type { Static } from "typebox";
import { ErrorResponse } from "@utils/errorsCollection";
import {
    ExchangeTokenRequestPayload,
    OAuthRedirectRequestQueries,
    OAuthRedirectResponse,
    TokenResponse,
} from "./auth.schema";

export type ErrorResponseType = Static<typeof ErrorResponse>;

// Responses
export type OAuthRedirectResponseType = Static<typeof OAuthRedirectResponse>;
export type TokenResponseType = Static<typeof TokenResponse>;

// Request Queries
export type OAuthRedirectRequestQueriesType = Static<typeof OAuthRedirectRequestQueries>;

// Request Payloads
export type ExchangeTokenRequestPayloadType = Static<typeof ExchangeTokenRequestPayload>;

// Controller Return Types
export type RedirectToProviderReturnType = OAuthRedirectResponseType | ErrorResponseType;
export type ExchangeTokenReturnType = TokenResponseType | ErrorResponseType;