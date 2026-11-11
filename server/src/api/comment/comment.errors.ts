import { ErrorsSet } from "@utils/errorsCollection";

export const CommentErrors = new ErrorsSet('user', {
    // DB
    "comment-db-invalid-error": [400, "data does not satisfy database"],
    "comment-db-data-not-found": [404, "referenced data does not exist"],
    "comment-db-error": [500, "database operation failed"],

    // Request
    "comment-invalid": [400, "invalid payload"],
    "comment-not-found": [404, "referenced comment does not exist"],

    // Conflict
    "comment-already-exists": [409, "comment with this payload already exists"],
});