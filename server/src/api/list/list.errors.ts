export class ListError extends Error { status = 500; }

export class ListNotFoundError extends ListError { override status = 404; }
export class ListInvalidError extends ListError { override status = 400; }
export class ListAlreadyExistsError extends ListError { override status = 409; }