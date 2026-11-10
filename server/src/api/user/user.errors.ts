// export class UserError extends Error { status = 500 }

// // User Errors
// export class UserNotFoundError extends UserError { override status = 404 }
// export class UserInvalidError extends UserError { override status = 400 }
// export class UserAlreadyExistsError extends UserError { override status = 409 }

// // Avatar Errors
// export class AvatarS3Error extends UserError { override status = 500; }
// export class AvatarCouldntReachDBError extends UserError { override status = 500; }
// export class AvatarAlreadyNoAvatarError extends UserError { override status = 409; }
// export class AvatarInvalidImageError extends UserError { override status = 400; }

import { ErrorsSet } from "@utils/errorsCollection";

export const UserErrors = new ErrorsSet('user', {
    // DB
    "user-db-invalid-error": [400, "data does not satisfy database"],
    "user-db-data-not-found": [404, "referenced data does not exist"],
    "user-db-error": [500, "database operation failed"],

    // Request
    "user-invalid": [400, "invalid payload"],
    "user-not-found": [404, "referenced user does not exist"],
    "user-link-not-found": [404, "referenced user link does not exist"],

    // Conflict
    "user-already-exists": [409, "user with this payload already exists"],
    "user-email-already-taken": [409, "user with this email already exists"],
    "user-nickname-already-taken": [409, "user with this nickname already exists"],
    "user-google-id-already-taken": [409, "this google id is already linked to another user"],
    "user-link-already-exists": [409, "this link already exists in user profile"],
});

export const AvatarErrors = new ErrorsSet('avatar', {
    // S3
    "new-avatar-s3-store": [500, "couldn't store new avatar"],
    "avatar-s3-remove": [500, "couldn't remove an avatar from the file storage"],
    "unreachable-s3-storage": [500, "couldn't reach the file storage"],

    // DB
    "read-avatar-db": [500, "couldn't receive avatar id from the database"],
    "update-avatar-db": [500, "database avatar update went wrong"],

    // Request
    "avatar-not-found": [404, "avatar is not found"],
    "invalid-image": [400, "invalid image payload"],

    // Conflict
    "already-no-avatar": [409, "already no avatar present"],
    "another-request-in-process": [409, "another request has interrupted this one"],
});