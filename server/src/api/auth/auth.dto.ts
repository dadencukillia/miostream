import type { Static } from "typebox";
import { ErrorResponse } from "@utils/errorsCollection";
import {
    AccessTokenRequestPayload,
    AccessTokenResponse,
    OAuthCallbackRequestQueries,
    OAuthCallbackResponse,
    OAuthRedirectRequestQueries,
    OAuthRedirectResponse,
} from "./auth.schema";

export type ErrorResponseType = Static<typeof ErrorResponse>;

// Responses
export type OAuthRedirectResponseType = Static<typeof OAuthRedirectResponse>;
export type OAuthCallbackResponseType = Static<typeof OAuthCallbackResponse>;
export type AccessTokenResponseType = Static<typeof AccessTokenResponse>;

// Requests
export type OAuthRedirectRequestQueriesType = Static<typeof OAuthRedirectRequestQueries>;
export type OAuthCallbackRequestQueriesType = Static<typeof OAuthCallbackRequestQueries>;
export type AccessTokenRequestPayloadType = Static<typeof AccessTokenRequestPayload>;

// Controller Return Types
export type RedirectToProviderReturnType = OAuthRedirectResponseType | ErrorResponseType;
export type OAuthCallbackReturnType = OAuthCallbackResponseType | ErrorResponseType;
export type AccessTokenReturnType = AccessTokenResponseType | ErrorResponseType;