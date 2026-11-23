import { ErrorsSet } from "@lib/errorsCollection";

export const PreviewErrors = new ErrorsSet("preview", {
	"unreachable-s3-storage": [500, "couldn't reach the file storage"],
	"preview-not-found": [404, "preview is not found"],
});
