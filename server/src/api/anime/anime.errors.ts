import { ErrorsSet } from "@utils/errorsCollection";

export const AnimeErrors = new ErrorsSet("anime", {
	"anime-not-found": [404, "anime not found"],
	"anime-already-exists": [409, "anime already exists"],
	"anime-invalid": [400, "invalid anime data"],
	"anime-not-created": [500, "anime not created"],
});
