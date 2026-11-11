import { Type } from "typebox";
import {
    Nullable,
    DateTimeType
} from "@utils/types";

// Tags
export const TAG_COMMENT = "comment";

// Responses
export const ErrorResponse = Type.Object({
    ok: Type.Literal(false, { description: "Indicates an unsuccessful operation" }),
    message: Type.String({
        description: "Human-readable error details",
        examples: ["database read error"]
    }),
}, {
    additionalProperties: false,
    description: "Standard error response payload",
    examples: [
        {
            ok: false,
            message: "database read error"
        }
    ]
});

export const CommentAuthorResponse = Type.Object({
    userId: Type.String({ format: "uuid", description: "Author user UUID" }),
    nickname: Type.String({ description: "Author nickname" }),
    avatarId: Nullable(Type.String({ format: "uuid", description: "Author avatar UUID" })),
}, {
    additionalProperties: false,
    description: "Author information"
});

export const CommentResponse = Type.Object({
    commentId: Type.String({ description: "Unique comment ID (bigint string)" }),
    content: Type.String({ description: "Comment body text" }),
    createdAt: DateTimeType,
    isEdited: Type.Boolean({ description: "Indicates if the comment was edited" }),
    author: CommentAuthorResponse,
}, {
    additionalProperties: false,
    description: "Single comment record"
});

export const CommentsResponse = Type.Object({
    comments: Type.Array(CommentResponse, { description: "List of comments" }),
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