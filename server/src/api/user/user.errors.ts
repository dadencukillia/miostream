export class UserError extends Error { status = 500 }

// User Errors
export class UserNotFoundError extends UserError { override status = 404 }
export class UserInvalidError extends UserError { override status = 400 }
export class UserAlreadyExistsError extends UserError { override status = 409 }

// Avatar Errors
export class AvatarS3Error extends UserError { override status = 500; }
export class AvatarCouldntReachDBError extends UserError { override status = 500; }
export class AvatarAlreadyNoAvatarError extends UserError { override status = 409; }
export class AvatarInvalidImageError extends UserError { override status = 400; }
