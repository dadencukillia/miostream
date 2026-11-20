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

// OAuth Provider Payloads
export interface GoogleOAuthUserInfo {
    /** Unique Google Account ID (immutable) */
    sub: string;
    /** Full name of the user */
    name: string;
    /** First name */
    given_name: string;
    /** Last name */
    family_name: string;
    /** URL to the user's profile picture */
    picture: string;
    /** User's email address */
    email: string;
    /** Whether the email address has been verified by Google */
    email_verified: boolean;
    /** User's preferred locale (e.g., "en" or "uk") */
    locale?: string;
    /** Hosted Google Workspace domain (if applicable) */
    hd?: string;
}
