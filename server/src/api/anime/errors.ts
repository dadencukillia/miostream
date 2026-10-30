export class AnimeError extends Error {
	status = 500;
}

export class AnimeNotFoundError extends AnimeError {
	override status = 404;
}

export class AnimeInvalidError extends AnimeError {
	override status = 400;
}

export class AnimeAlreadyExistsError extends AnimeError {
	override status = 409;
}