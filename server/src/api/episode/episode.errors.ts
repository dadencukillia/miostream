import { ErrorsSet } from "@lib/errorsCollection";

export const EpisodeErrors = new ErrorsSet("episode", {
  "db-read": [500, "couldn't read database"],
  "db-create": [500, "database creation error"],
  "db-update": [500, "database updation error"],
  "not-found": [404, "episode not found"],
  "invalid-localization-type": [400, "invalid specified localization type"],
  "same-previous-episode-id": [409, "specify another episode id"]
});

export const PreviewErrors = new ErrorsSet("preview", {
  // S3
  "new-preview-s3-store": [500, "couldn't store new preview"],
  "preview-s3-remove": [500, "couldn't remove a preview from the file storage"],
  "unreachable-s3-storage": [500, "couldn't reach the file storage"],

  // DB
  "read-preview-db": [500, "couldn't receive preview id from the database"],
  "update-preview-db": [500, "database preview update went wrong"],

  // Request
  "preview-not-found": [404, "preview is not found"],
  "invalid-image": [400, "invalid image payload"],

  // Conflict
  "already-no-preview": [409, "already no preview present"],
  "another-request-in-process": [409, "another request has interrupted this one"],
});