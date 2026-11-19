import type { Static } from "typebox";
import { ErrorResponse } from "@utils/errorsCollection";
import {
    AccessTokenResponse,
    OAuthCallbackRequestQueries,
    OAuthRedirectRequestQueries,
} from "./auth.schema";

export type ErrorResponseType = Static<typeof ErrorResponse>;

// Responses
export type AccessTokenResponseType = Static<typeof AccessTokenResponse>;

// Requests
export type OAuthRedirectRequestQueriesType = Static<typeof OAuthRedirectRequestQueries>;
export type OAuthCallbackRequestQueriesType = Static<typeof OAuthCallbackRequestQueries>;

// Controller Return Types
export type RedirectToProviderReturnType = ErrorResponseType | undefined;
export type OAuthCallbackReturnType = ErrorResponseType | undefined;
export type AccessTokenReturnType = AccessTokenResponseType | ErrorResponseType;