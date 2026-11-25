import { ErrorsSet } from "@lib/errorsCollection";

export const EpisodeErrors = new ErrorsSet("episode", {
  "db-read": [500, "couldn't read database"]
});
