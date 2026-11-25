import { ErrorsSet } from "@lib/errorsCollection";

export const EpisodeErrors = new ErrorsSet("episode", {
  "db-read": [500, "couldn't read database"],
  "db-create": [500, "database creation error"],
  "db-update": [500, "database updation error"],
  "not-found": [404, "episode not found"],
  "invalid-localization-type": [400, "invalid specified localization type"]
});
