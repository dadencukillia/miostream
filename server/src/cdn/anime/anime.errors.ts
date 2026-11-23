import { ErrorsSet } from "@utils/errorsCollection";

export const AnimeCoverErrors = new ErrorsSet("anime-cover", {
  "unreachable-s3-storage": [500, "couldn't reach the file storage"],
  "anime-cover-not-found": [404, "anime cover is not found"],
});
