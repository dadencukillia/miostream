import type { Static } from "typebox";
import * as commentSchema from "./comment.schema";

// Responses
export type ErrorResponseType = Static<typeof commentSchema.ErrorResponse>;
export type CommentAuthorResponseType = Static<typeof commentSchema.CommentAuthorResponse>;
export type CommentResponseType = Static<typeof commentSchema.CommentResponse>;
export type CommentsResponseType = Static<typeof commentSchema.CommentsResponse>;

// Request Params
export type AnimeIdCommentRequestParamsType = Static<typeof commentSchema.AnimeIdCommentRequestParams>;

// Request Queries
export type GetCommentsRequestQueriesType = Static<typeof commentSchema.GetCommentsRequestQueries>;

// Request Payloads
export type PostCommentRequestPayloadType = Static<typeof commentSchema.PostCommentRequestPayload>;

// Controller Return Types
export type GetCommentsReturnType = CommentsResponseType | ErrorResponseType;
export type PostCommentReturnType = CommentResponseType | ErrorResponseType;