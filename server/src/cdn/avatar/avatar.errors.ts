import { ErrorsSet } from "../../utils/errorsCollection";

export const AvatarErrors = new ErrorsSet("avatar", {
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
