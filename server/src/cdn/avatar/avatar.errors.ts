export class AvatarError extends Error { status = 500; }

export class AvatarS3Error extends AvatarError { override status = 500; }
export class AvatarNotFoundError extends AvatarError { override status = 404; }
