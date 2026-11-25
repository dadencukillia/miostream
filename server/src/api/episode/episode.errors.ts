import { ErrorsSet } from "@lib/errorsCollection";

export const EpisodeErrors = new ErrorsSet("episode", {
  "db-read": [500, "couldn't read database"],
  "not-found": [404, "episode not found"]
});
