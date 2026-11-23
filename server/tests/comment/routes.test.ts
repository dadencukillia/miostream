import { afterAll, describe, expect, test } from "bun:test";
import { type FastifyInstance } from "fastify";
import { wipeDatabaseTables } from "../dbHelper";
import { fastifyInstance } from "../fastifyHelper";
import { newTestAuth } from "../oauthHelper";
import { beforeAllReturning } from "../testHelper";

describe("comment routes", () => {
    let fastify: FastifyInstance;
    let animeId: string = "";
    let userCommentId: string = "";
    let otherUserCommentId: string = "";
    let otherAnimeId: string = "";

    const beforeValues = beforeAllReturning(async () => {
        fastify = await fastifyInstance();
        await wipeDatabaseTables("public.comments", "public.animes", "public.sessions", "public.users");

        let regularAuth = await newTestAuth("user", "active");
        let adminAuth = await newTestAuth("admin", "active");
        let thirdAuth = await newTestAuth("user", "active"); 

        const animeRes = await fastify.pg.query<{ anime_id: string }>(
            "INSERT INTO public.animes (slug) VALUES ($1) RETURNING anime_id;",
            ["route-test-anime"]
        );
        animeId = animeRes.rows[0]!.anime_id;

        const otherAnimeRes = await fastify.pg.query<{ anime_id: string }>(
            "INSERT INTO public.animes (slug) VALUES ($1) RETURNING anime_id;",
            ["route-other-anime"]
        );
        otherAnimeId = otherAnimeRes.rows[0]!.anime_id;

        return { regularAuth, adminAuth, thirdAuth };
    });

    afterAll(async () => {
        await wipeDatabaseTables("public.comments", "public.animes", "public.sessions", "public.users");
        await fastify.close();
    });

    test("post comment (auth required and validation)", async () => {
        const { regularAuth } = await beforeValues;

        const unauth = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "Unauthorized comment" },
        });
        expect(unauth.statusCode).toBe(403);

        const whitespaceOnly = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "    " },
            headers: { authorization: regularAuth.authorization },
        });
        expect(whitespaceOnly.statusCode).toBe(400);
        expect(whitespaceOnly.json()).toMatchObject({ ok: false });

        const missingAnime = await fastify.inject({
            path: `/api/anime/${crypto.randomUUID()}/comment`,
            method: "POST",
            payload: { content: "Comment on missing anime" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(missingAnime.statusCode).toBe(404);
        expect(missingAnime.json()).toMatchObject({ ok: false });

        const response = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "  Awesome anime episode!  " },
            headers: { authorization: regularAuth.authorization },
        });

        expect(response.statusCode).toBe(201);
        const body = response.json<{
            commentId: string;
            content: string;
            isEdited: boolean;
            author: { userId: string; nickname: string; avatarId: string | null };
        }>();
        userCommentId = body.commentId;

        expect(body).toMatchObject({
            content: "Awesome anime episode!",
            isEdited: false,
            author: {
                userId: regularAuth.user.userId,
                nickname: regularAuth.user.nickname,
                avatarId: null,
            },
        });
    });

    test("get comments (public and paginated)", async () => {
        const { thirdAuth } = await beforeValues;

        // Seed a second comment authored by otherUserId
        const seeded = await fastify.pg.query<{ comment_id: string }>(
            "INSERT INTO public.comments (anime_id, author_id, content) VALUES ($1, $2, $3) RETURNING comment_id;",
            [animeId, thirdAuth.user.userId, "Second user comment"]
        );
        otherUserCommentId = String(seeded.rows[0]!.comment_id);

        const page1 = await fastify.inject({
            path: `/api/anime/${animeId}/comment?limit=1`,
            method: "GET",
        });
        expect(page1.statusCode).toBe(200);
        const page1Body = page1.json<{
            comments: Array<{ commentId: string; content: string }>;
            nextCursor: string | null;
        }>();
        expect(page1Body.comments.length).toBe(1);
        expect(page1Body.comments[0]?.commentId).toBe(otherUserCommentId);
        expect(page1Body.nextCursor).toBe(otherUserCommentId);

        const page2 = await fastify.inject({
            path: `/api/anime/${animeId}/comment?cursor=${page1Body.nextCursor}&limit=1`,
            method: "GET",
        });
        expect(page2.statusCode).toBe(200);
        const page2Body = page2.json<{
            comments: Array<{ commentId: string; content: string }>;
            nextCursor: string | null;
        }>();
        expect(page2Body.comments.length).toBe(1);
        expect(page2Body.comments.length).toBe(1);
        expect(page2Body.comments[0]?.commentId).toBe(userCommentId);
        expect(page2Body.nextCursor).toBe(userCommentId);

        const page3 = await fastify.inject({
            path: `/api/anime/${animeId}/comment?cursor=${page2Body.nextCursor}&limit=1`,
            method: "GET",
        });
        expect(page3.statusCode).toBe(200);
        expect(page3.json()).toEqual({ ok: true, comments: [], nextCursor: null });

        const invalidParams = await fastify.inject({
            path: `/api/anime/not-a-uuid/comment?limit=100`,
            method: "GET",
        });
        expect(invalidParams.statusCode).toBe(400);
        expect(invalidParams.json()).toMatchObject({ ok: false });
    });

    test("update comment (owner only)", async () => {
        const { regularAuth } = await beforeValues;

        const unauth = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "Edited" },
        });
        expect(unauth.statusCode).toBe(403);

        const invalidId = await fastify.inject({
            path: `/api/anime/${animeId}/comment/0`,
            method: "PUT",
            payload: { content: "Edited" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(invalidId.statusCode).toBe(400);

        const notOwner = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${otherUserCommentId}`,
            method: "PUT",
            payload: { content: "Trying to edit foreign comment" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(notOwner.statusCode).toBe(404);
        expect(notOwner.json()).toMatchObject({ ok: false });

        const wrongAnime = await fastify.inject({
            path: `/api/anime/${otherAnimeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "Wrong anime ID" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(wrongAnime.statusCode).toBe(404);

        const response = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "  Edited anime episode comment!  " },
            headers: { authorization: regularAuth.authorization },
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
            commentId: userCommentId,
            content: "Edited anime episode comment!",
            isEdited: true,
        });
    });

    test("delete comment (owner and admin)", async () => {
        const { regularAuth, adminAuth } = await beforeValues;

        const unauth = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "DELETE",
        });
        expect(unauth.statusCode).toBe(403);

        // Regular user cannot delete another user's comment
        const forbiddenByOwnership = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${otherUserCommentId}`,
            method: "DELETE",
            headers: { authorization: regularAuth.authorization },
        });
        expect(forbiddenByOwnership.statusCode).toBe(404);
        expect(forbiddenByOwnership.json()).toMatchObject({ ok: false });

        // Owner deletes own comment
        const ownerDelete = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "DELETE",
            headers: { authorization: regularAuth.authorization },
        });
        expect(ownerDelete.statusCode).toBe(204);
        expect(ownerDelete.body).toBe("");

        // Admin deletes another user's comment
        const adminDelete = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${otherUserCommentId}`,
            method: "DELETE",
            headers: { authorization: adminAuth.authorization },
        });
        expect(adminDelete.statusCode).toBe(204);
        expect(adminDelete.body).toBe("");

        // Verify list is now empty
        const listAfter = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "GET",
        });
        expect(listAfter.statusCode).toBe(200);
        expect(listAfter.json()).toEqual({ ok: true, comments: [], nextCursor: null });
    });
});
