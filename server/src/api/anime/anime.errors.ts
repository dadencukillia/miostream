import { ErrorsSet } from "@utils/errorsCollection";

export const AnimeErrors = new ErrorsSet("anime", {
	"anime-not-found": [404, "Anime not found"],
	"anime-already-exists": [409, "Anime with this slug already exists"],
	"anime-invalid": [400, "Invalid anime data"],
	"anime-not-created": [500, "Anime was not created"],
});
