import type { Static } from "typebox";
import { ErrorResponse } from "@lib/errorsCollection";
import type { UserResponseType } from "@/api/user/user.dto";
import {
    AccessTokenResponse,
    LoginRequestPayload,
    LogoutRequestQueries,
    OAuthCallbackRequestQueries,
    OAuthRedirectRequestQueries,
    RegisterRequestPayload,
    UpdatePasswordRequestPayload,
} from "./auth.schema";

export type ErrorResponseType = Static<typeof ErrorResponse>;

// Responses
export type AccessTokenResponseType = Static<typeof AccessTokenResponse>;

// Requests
export type RegisterRequestPayloadType = Static<typeof RegisterRequestPayload>;
export type LoginRequestPayloadType = Static<typeof LoginRequestPayload>;
export type UpdatePasswordRequestPayloadType = Static<typeof UpdatePasswordRequestPayload>;
export type OAuthRedirectRequestQueriesType = Static<typeof OAuthRedirectRequestQueries>;
export type OAuthCallbackRequestQueriesType = Static<typeof OAuthCallbackRequestQueries>;
export type LogoutRequestQueriesType = Static<typeof LogoutRequestQueries>;

// Controller Return Types
export type RegisterReturnType = UserResponseType | ErrorResponseType;
export type LoginReturnType = UserResponseType | ErrorResponseType;
export type UpdatePasswordReturnType = null | ErrorResponseType;
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
