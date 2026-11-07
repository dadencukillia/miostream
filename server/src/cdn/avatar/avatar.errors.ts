export class AvatarError extends Error { status = 500; }

export class AvatarS3Error extends AvatarError { override status = 500; }
export class AvatarNotFoundError extends AvatarError { override status = 404; }
export class AvatarCouldntReachDBError extends AvatarError { override status = 500; }
export class AvatarAlreadyNoAvatarError extends AvatarError { override status = 409; }
export class AvatarAnotherRequestInProcessError extends AvatarError { override status = 409; }
export class AvatarInvalidImageError extends AvatarError { override status = 400; }
