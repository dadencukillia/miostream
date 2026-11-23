import { Type } from "typebox";
import {
    Nullable,
    DateTimeType
} from "@utils/types";
import { ErrorResponse } from "@lib/errorsCollection";

// Tags
export const TAG_COMMENT = "Comment";

// Responses
export const CommentAuthorResponse = Type.Object({
    userId: Type.String({ format: "uuid", description: "Author user UUID" }),
    nickname: Type.String({ description: "Author nickname" }),
    avatarId: Nullable(Type.String({ format: "uuid", description: "Author avatar UUID" })),
}, {
    additionalProperties: false,
    description: "Author information"
});

export const Comment = Type.Object({
    commentId: Type.String({ description: "Unique comment ID (bigint string)" }),
    content: Type.String({ description: "Comment body text" }),
    createdAt: DateTimeType,
    isEdited: Type.Boolean({ description: "Indicates if the comment was edited" }),
    author: CommentAuthorResponse,
}, {
    additionalProperties: false,
    description: "Single comment record"
});

export const CommentResponse = Type.Object({
    ok: Type.Literal(true, { description: "Indicates a successful operation" }),
    commentId: Type.String({ description: "Unique comment ID (bigint string)" }),
    content: Type.String({ description: "Comment body text" }),
    createdAt: DateTimeType,
    isEdited: Type.Boolean({ description: "Indicates if the comment was edited" }),
    author: CommentAuthorResponse,
}, {
    additionalProperties: false,
    description: "Single comment response payload"
});

export const CommentsResponse = Type.Object({
    ok: Type.Literal(true, { description: "Indicates a successful operation" }),
    comments: Type.Array(Comment, { description: "List of comments" }),
    nextCursor: Nullable(Type.String({ description: "Cursor for the next page, or null if end of list" })),
}, {
    additionalProperties: false,
    description: "Paginated comments list"
});

// Request Params
export const AnimeIdCommentRequestParams = Type.Object({
    animeId: Type.String({
        format: "uuid",
        description: "Anime UUID",
        examples: ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"]
    })
}, {
    additionalProperties: false
});

export const CommentRequestParams = Type.Object({
    animeId: Type.String({
        format: "uuid",
        description: "Anime UUID",
        examples: ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"]
    }),
    commentId: Type.String({
        pattern: "^[1-9][0-9]*$",
        description: "Unique comment ID (bigint string)",
        examples: ["42"]
    })
}, {
    additionalProperties: false
});

// Request Queries
export const GetCommentsRequestQueries = Type.Object({
    cursor: Type.Optional(Type.String({
        pattern: "^[0-9]+$",
        default: "0",
        description: "Cursor ID (comment_id). Pass 0 or omit to fetch the first page."
    })),
    limit: Type.Optional(Type.Integer({
        minimum: 1,
        maximum: 50,
        default: 20,
        description: "Number of comments to return"
    }))
}, {
    additionalProperties: false
});

// Request Payloads
export const PostCommentRequestPayload = Type.Object({
    content: Type.String({
        minLength: 1,
        maxLength: 2000,
        description: "Comment text content (1-2000 non-whitespace characters)",
        examples: ["Great episode, the animation quality is top-notch!"]
    })
}, {
    additionalProperties: false,
    description: "Payload for creating a new comment",
    examples: [
        {
            content: "Great episode, the animation quality is top-notch!"
        }
    ]
});

export const UpdateCommentRequestPayload = Type.Object({
    content: Type.String({
        minLength: 1,
        maxLength: 2000,
        description: "Updated comment text content (1-2000 non-whitespace characters)",
        examples: ["Updated thoughts after rewatching the episode!"]
    })
}, {
    additionalProperties: false,
    description: "Payload for updating an existing comment",
    examples: [
        {
            content: "Updated thoughts after rewatching the episode!"
        }
    ]
});

// Fastify Route Schemas
export const GetCommentsSchema = {
    tags: [TAG_COMMENT],
    summary: "Get comments by anime ID",
    description: "Retrieves a cursor-paginated list of comments for the specified anime.",
    params: AnimeIdCommentRequestParams,
    querystring: GetCommentsRequestQueries,
    response: {
        200: CommentsResponse,
        400: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
    },
} as const;

export const PostCommentSchema = {
    tags: [TAG_COMMENT],
    summary: "Create comment",
    description: "Creates a new comment for the specified anime on behalf of the authenticated user.",
    params: AnimeIdCommentRequestParams,
    body: PostCommentRequestPayload,
    response: {
        201: CommentResponse,
        400: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
    },
} as const;

export const UpdateCommentSchema = {
    tags: [TAG_COMMENT],
    summary: "Update comment",
    description: "Updates the text content of an existing comment owned by the authenticated user.",
    params: CommentRequestParams,
    body: UpdateCommentRequestPayload,
    response: {
        200: CommentResponse,
        400: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
    },
} as const;

export const DeleteCommentSchema = {
    tags: [TAG_COMMENT],
    summary: "Delete comment",
    description: "Permanently deletes a comment. Allowed for the comment author and administrators.",
    params: CommentRequestParams,
    response: {
        204: Type.Null({ description: "Comment removed successfully" }),
        400: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
    },
} as const;
