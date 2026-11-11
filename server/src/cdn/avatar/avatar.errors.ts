import { ErrorsSet } from "@utils/errorsCollection";

export const AvatarErrors = new ErrorsSet("avatar", {
  "unreachable-s3-storage": [500, "couldn't reach the file storage"],
  "avatar-not-found": [404, "avatar is not found"],
});
