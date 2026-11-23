import { ErrorsSet } from "@lib/errorsCollection";

export const PreviewErrors = new ErrorsSet("preview", {
	// S3
	"unreachable-s3-storage": [500, "couldn't reach the file storage"],

	// Request
	"preview-not-found": [404, "preview is not found"],
});
