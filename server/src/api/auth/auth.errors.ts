import { ErrorsSet } from "@utils/errorsCollection";

export const AuthErrors = new ErrorsSet("auth", {
    "oauth-missing-code": [400, "oauth request is missing an authorization code"],
    "oauth-invalid-state": [400, "invalid oauth state"],
    "oauth-unsupported-provider": [400, "unsupported oauth provider"],
    "auth-invalid-session-token": [400, "invalid session token"],
    "auth-invalid-access-token": [401, "invalid access token"],
    "auth-db-failed": [500, "couldn't reach database"],
    "auth-db-not-found": [404, "entry not found in database"],
    "not-implemented": [501, "endpoint is not implemented yet"],
    "auth-no-session-access": [403, "no access to the authorization session"],
});
