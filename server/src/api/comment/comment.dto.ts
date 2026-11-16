import type { Static } from "typebox";
import type * as commentSchema from "./comment.schema";
import { ErrorResponse } from "@utils/errorsCollection";

// Responses
export type ErrorResponseType = Static<typeof ErrorResponse>;
export type CommentAuthorResponseType = Static<typeof commentSchema.CommentAuthorResponse>;
export type CommentType = Static<typeof commentSchema.Comment>;
export type CommentResponseType = Static<typeof commentSchema.CommentResponse>;
export type CommentsResponseType = Static<typeof commentSchema.CommentsResponse>;
export type CommentsType = Omit<CommentsResponseType, "ok">;

// Request Params
export type AnimeIdCommentRequestParamsType = Static<typeof commentSchema.AnimeIdCommentRequestParams>;
export type CommentRequestParamsType = Static<typeof commentSchema.CommentRequestParams>;

// Request Queries
export type GetCommentsRequestQueriesType = Static<typeof commentSchema.GetCommentsRequestQueries>;

// Request Payloads
export type PostCommentRequestPayloadType = Static<typeof commentSchema.PostCommentRequestPayload>;
export type UpdateCommentRequestPayloadType = Static<typeof commentSchema.UpdateCommentRequestPayload>;

// Controller Return Types
export type GetCommentsReturnType = CommentsResponseType | ErrorResponseType;
export type PostCommentReturnType = CommentResponseType | ErrorResponseType;
export type UpdateCommentReturnType = CommentResponseType | ErrorResponseType;
export type DeleteCommentReturnType = null | ErrorResponseType;