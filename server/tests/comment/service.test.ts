import connector from "@utils/connector";
import { PostgresConnection } from "@/connections/pg";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import Fastify, { type FastifyInstance } from "fastify";
import * as service from "@/api/comment/comment.service";
import * as userService from "@/api/user/services/user.service";

describe("comment service", () => {
    let fastify: FastifyInstance;
    let authorId: string = "";
    let otherUserId: string = "";
    let animeId: string = "";
    let otherAnimeId: string = "";
    let firstCommentId: string = "";
    let secondCommentId: string = "";

    beforeAll(async () => {
        fastify = Fastify({ logger: false, pluginTimeout: 0 });

        await fastify.register(connector, {
            retries: 3,
            interval: 15 * 1000,
            connections: [PostgresConnection],
        });

        await fastify.pg.query("DELETE FROM public.comments;");
        await fastify.pg.query("DELETE FROM public.animes;");
        await fastify.pg.query("DELETE FROM public.users;");

        const author = await userService.createUser(fastify.pg, {
            nickname: "comment_author",
            fullName: "Comment Author",
            email: "comment_author@miostream.dev",
            password: "password123",
            timezone: "Europe/Kyiv",
        });
        authorId = author.userId;

        const otherUser = await userService.createUser(fastify.pg, {
            nickname: "comment_other",
            fullName: "Comment Other",
            email: "comment_other@miostream.dev",
            password: "password123",
            timezone: "Europe/Kyiv",
        });
        otherUserId = otherUser.userId;

        const animeRes = await fastify.pg.query<{ anime_id: string }>(
            "INSERT INTO public.animes (slug) VALUES ($1) RETURNING anime_id;",
            ["test-comment-anime"]
        );
        animeId = animeRes.rows[0]!.anime_id;

        const otherAnimeRes = await fastify.pg.query<{ anime_id: string }>(
            "INSERT INTO public.animes (slug) VALUES ($1) RETURNING anime_id;",
            ["test-comment-other-anime"]
        );
        otherAnimeId = otherAnimeRes.rows[0]!.anime_id;
    });

    afterAll(async () => {
        await fastify.pg.query("DELETE FROM public.comments;");
        await fastify.pg.query("DELETE FROM public.animes;");
        await fastify.pg.query("DELETE FROM public.users;");
        await fastify.close();
    });

    test("post comment", async () => {
        const created = await service.postComment(fastify.pg, animeId, authorId, {
            content: "  First comment!  ",
        });

        firstCommentId = created.commentId;

        expect(created).toMatchObject({
            commentId: firstCommentId,
            content: "First comment!",
            isEdited: false,
            author: {
                userId: authorId,
                nickname: "comment_author",
                avatarId: null,
            },
        });
        expect(created.createdAt).toBeDefined();

        expect(
            service.postComment(fastify.pg, crypto.randomUUID(), authorId, {
                content: "Missing anime",
            })
        ).rejects.toMatchObject({ statusCode: 404 });

        expect(
            service.postComment(fastify.pg, animeId, crypto.randomUUID(), {
                content: "Missing author",
            })
        ).rejects.toMatchObject({ statusCode: 404 });

        expect(
            service.postComment(fastify.pg, "invalid-uuid", authorId, {
                content: "Bad UUID",
            })
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("get comments with cursor pagination", async () => {
        const second = await service.postComment(fastify.pg, animeId, otherUserId, {
            content: "Second comment",
        });
        secondCommentId = second.commentId;

        const third = await service.postComment(fastify.pg, animeId, authorId, {
            content: "Third comment",
        });

        // First page (limit 2, newest first)
        const page1 = await service.getComments(fastify.pg, animeId, { limit: 2 });
        expect(page1.comments.length).toBe(2);
        expect(page1.comments[0]?.commentId).toBe(third.commentId);
        expect(page1.comments[1]?.commentId).toBe(secondCommentId);
        expect(page1.nextCursor).toBe(secondCommentId);

        // Second page using cursor
        const page2 = await service.getComments(fastify.pg, animeId, {
            cursor: page1.nextCursor!,
            limit: 2,
        });
        expect(page2.comments.length).toBe(1);
        expect(page2.comments[0]?.commentId).toBe(firstCommentId);
        expect(page2.nextCursor).toBeNull();

        // Cursor "0" returns first page
        const all = await service.getComments(fastify.pg, animeId, {
            cursor: "0",
            limit: 20,
        });
        expect(all.comments.length).toBe(3);
        expect(all.nextCursor).toBeNull();

        // Empty list for anime without comments
        const empty = await service.getComments(fastify.pg, otherAnimeId, {});
        expect(empty).toEqual({ comments: [], nextCursor: null });

        expect(
            service.getComments(fastify.pg, "invalid-uuid", {})
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("update comment", async () => {
        const updated = await service.updateComment(
            fastify.pg,
            animeId,
            firstCommentId,
            authorId,
            { content: "  Updated first comment  " }
        );

        expect(updated).toMatchObject({
            commentId: firstCommentId,
            content: "Updated first comment",
            isEdited: true,
            author: {
                userId: authorId,
                nickname: "comment_author",
                avatarId: null,
            },
        });

        // Forbid updating someone else's comment
        expect(
            service.updateComment(fastify.pg, animeId, firstCommentId, otherUserId, {
                content: "Hacked content",
            })
        ).rejects.toMatchObject({ statusCode: 404 });

        // Wrong animeId
        expect(
            service.updateComment(fastify.pg, otherAnimeId, firstCommentId, authorId, {
                content: "Wrong anime",
            })
        ).rejects.toMatchObject({ statusCode: 404 });

        // Non-existent commentId
        expect(
            service.updateComment(fastify.pg, animeId, "999999999", authorId, {
                content: "Ghost comment",
            })
        ).rejects.toMatchObject({ statusCode: 404 });
    });

    test("delete comment by owner and privileged user", async () => {
        // Non-owner regular user cannot delete
        expect(
            service.deleteComment(fastify.pg, animeId, firstCommentId, otherUserId, false)
        ).rejects.toMatchObject({ statusCode: 404 });

        // Wrong animeId cannot delete
        expect(
            service.deleteComment(fastify.pg, otherAnimeId, firstCommentId, authorId, false)
        ).rejects.toMatchObject({ statusCode: 404 });

        // Owner deletes own comment
        await service.deleteComment(fastify.pg, animeId, firstCommentId, authorId, false);

        expect(
            service.deleteComment(fastify.pg, animeId, firstCommentId, authorId, false)
        ).rejects.toMatchObject({ statusCode: 404 });

        // Privileged user (admin/moderator) deletes another user's comment
        await service.deleteComment(fastify.pg, animeId, secondCommentId, authorId, true);

        const remaining = await service.getComments(fastify.pg, animeId, {});
        expect(remaining.comments.length).toBe(1);
    });
});