import { ErrorsSet } from "@utils/errorsCollection";

export const AuthErrors = new ErrorsSet("auth", {
    "oauth-missing-code": [400, "oauth request is missing an authorization code"],
    "oauth-invalid-state": [400, "invalid oauth state"],
    "oauth-token-exchange-failed": [502, "oauth token exchange failed"],

    "auth-invalid-session-token": [400, "invalid session token"],
    "auth-db-error": [500, "couldn't reach database"],
});
