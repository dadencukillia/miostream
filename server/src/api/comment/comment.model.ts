import { Plain } from "@utils/types";
import { generateTransformer } from "@lib/modelTransformer";

// Author Transformation

export interface CommentTransformAuthorInput {
    commentId: string | number | bigint;
    userId: string;
    nickname: string;
    avatarId: string | null;
}

export interface CommentTransformAuthorOutput {
    commentId: string;
    author: {
        userId: string;
        nickname: string;
        avatarId: string | null;
    };
}

export const commentTransformAuthor = generateTransformer({
    delete: ["userId", "nickname", "avatarId"],
    map: (comment: Plain<CommentTransformAuthorInput>): Plain<CommentTransformAuthorOutput> => ({
        commentId: String(comment.commentId),
        author: {
            userId: comment.userId,
            nickname: comment.nickname,
            avatarId: comment.avatarId,
        },
    }),
});
