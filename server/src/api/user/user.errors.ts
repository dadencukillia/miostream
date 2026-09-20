export class UserError              extends Error { status = 500 }

export class UserNotFoundError      extends UserError { override status = 404 }
export class UserInvalidError       extends UserError { override status = 400 }
export class UserAlreadyExistsError extends UserError { override status = 409 }