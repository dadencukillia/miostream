import type { Static } from "typebox";
import * as commentSchema from "./comment.schema";

// Responses
export type ErrorResponseType = Static<typeof commentSchema.ErrorResponse>;
export type CommentAuthorResponseType = Static<typeof commentSchema.CommentAuthorResponse>;
export type CommentResponseType = Static<typeof commentSchema.CommentResponse>;
export type CommentsResponseType = Static<typeof commentSchema.CommentsResponse>;

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