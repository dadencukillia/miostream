import { afterAll, describe, expect, test } from "bun:test";
import { wipeDatabaseTables } from "../dbHelper";
import { fastifyInstance } from "../fastifyHelper";
import { newTestAuth, wipeOAuthUsers } from "../oauthHelper";
import { beforeAllReturning } from "../testHelper";

describe("comment routes", () => {
    let userCommentId: string = "";
    let otherUserCommentId: string = "";
    let thirdCommentId: string = "";

    const beforeValues = beforeAllReturning(async () => {
        const fastify = await fastifyInstance();
        await wipeDatabaseTables("public.comments", "public.animes");
        await wipeOAuthUsers();

        const regularAuth = await newTestAuth("user", "active");
        const adminAuth = await newTestAuth("admin", "active");
        const thirdAuth = await newTestAuth("user", "active");
        const bannedAuth = await newTestAuth("user", "banned");

        const animeRes = await fastify.pg.query<{ anime_id: string }>(
            "INSERT INTO public.animes (slug) VALUES ($1) RETURNING anime_id;",
            ["route-test-anime"]
        );
        const animeId = animeRes.rows[0]!.anime_id;

        const otherAnimeRes = await fastify.pg.query<{ anime_id: string }>(
            "INSERT INTO public.animes (slug) VALUES ($1) RETURNING anime_id;",
            ["route-other-anime"]
        );
        const otherAnimeId = otherAnimeRes.rows[0]!.anime_id;

        return {
            fastify,
            regularAuth,
            adminAuth,
            thirdAuth,
            bannedAuth,
            animeId,
            otherAnimeId,
        };
    });

    afterAll(async () => {
        const { fastify } = await beforeValues;
        await wipeDatabaseTables("public.comments", "public.animes");
        await wipeOAuthUsers();
        await fastify.close();
    });

    test("POST /api/anime/:animeId/comment - auth, validation, and creation", async () => {
        const { fastify, regularAuth, bannedAuth, animeId } = await beforeValues;

        // Unauthenticated request
        const unauth = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "Unauthorized comment" },
        });
        expect(unauth.statusCode).toBe(403);
        expect(unauth.json()).toMatchObject({ ok: false });

        // Banned user cannot post comments
        const banned = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "Banned user comment" },
            headers: { authorization: bannedAuth.authorization },
        });
        expect(banned.statusCode).toBe(403);
        expect(banned.json()).toMatchObject({ ok: false });

        // Invalid animeId UUID format
        const invalidAnimeId = await fastify.inject({
            path: "/api/anime/not-a-uuid/comment",
            method: "POST",
            payload: { content: "Valid text" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(invalidAnimeId.statusCode).toBe(400);
        expect(invalidAnimeId.json()).toMatchObject({ ok: false, error: "validation" });

        // Schema validation errors: empty string, too long (>2000), missing field, extra field
        const emptyContent = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(emptyContent.statusCode).toBe(400);
        expect(emptyContent.json()).toMatchObject({ ok: false, error: "validation" });

        const tooLongContent = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "a".repeat(2001) },
            headers: { authorization: regularAuth.authorization },
        });
        expect(tooLongContent.statusCode).toBe(400);
        expect(tooLongContent.json()).toMatchObject({ ok: false, error: "validation" });

        const extraProperty = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "Valid", extraField: true },
            headers: { authorization: regularAuth.authorization },
        });
        expect(extraProperty.statusCode).toBe(400);
        expect(extraProperty.json()).toMatchObject({ ok: false, error: "validation" });

        // Whitespace-only content rejected by controller
        const whitespaceOnly = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "   \n\t  " },
            headers: { authorization: regularAuth.authorization },
        });
        expect(whitespaceOnly.statusCode).toBe(400);
        expect(whitespaceOnly.json()).toMatchObject({ ok: false, error: "comment-invalid" });

        // Non-existent anime UUID
        const missingAnime = await fastify.inject({
            path: `/api/anime/${crypto.randomUUID()}/comment`,
            method: "POST",
            payload: { content: "Comment on missing anime" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(missingAnime.statusCode).toBe(404);
        expect(missingAnime.json()).toMatchObject({ ok: false, error: "comment-db-data-not-found" });

        // Successful creation with surrounding whitespace trimmed
        const response = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "  Awesome anime episode!  " },
            headers: { authorization: regularAuth.authorization },
        });

        expect(response.statusCode).toBe(201);
        const body = response.json<{
            ok: true;
            commentId: string;
            content: string;
            createdAt: string;
            isEdited: boolean;
            author: { userId: string; nickname: string; avatarId: string | null };
        }>();
        userCommentId = body.commentId;

        expect(body).toMatchObject({
            ok: true,
            content: "Awesome anime episode!",
            isEdited: false,
            author: {
                userId: regularAuth.user.userId,
                nickname: regularAuth.user.nickname,
                avatarId: null,
            },
        });
        expect(typeof body.commentId).toBe("string");
        expect(Number.isNaN(Date.parse(body.createdAt))).toBe(false);
    });

    test("GET /api/anime/:animeId/comment - public access, pagination, and query validation", async () => {
        const { fastify, regularAuth, thirdAuth, animeId, otherAnimeId } = await beforeValues;

        // Seed two more comments on target anime and one comment on another anime
        const secondRes = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "Second user comment" },
            headers: { authorization: thirdAuth.authorization },
        });
        expect(secondRes.statusCode).toBe(201);
        otherUserCommentId = secondRes.json<{ commentId: string }>().commentId;

        const thirdRes = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "Third comment by regular user" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(thirdRes.statusCode).toBe(201);
        thirdCommentId = thirdRes.json<{ commentId: string }>().commentId;

        const isolatedRes = await fastify.inject({
            path: `/api/anime/${otherAnimeId}/comment`,
            method: "POST",
            payload: { content: "Comment on another anime" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(isolatedRes.statusCode).toBe(201);

        // Page 1 (limit=2 -> returns 3rd and 2nd comments in descending order)
        const page1 = await fastify.inject({
            path: `/api/anime/${animeId}/comment?limit=2`,
            method: "GET",
        });
        expect(page1.statusCode).toBe(200);
        const page1Body = page1.json<{
            ok: true;
            comments: Array<{ commentId: string; content: string }>;
            nextCursor: string | null;
        }>();
        expect(page1Body.ok).toBe(true);
        expect(page1Body.comments).toHaveLength(2);
        expect(page1Body.comments[0]?.commentId).toBe(thirdCommentId);
        expect(page1Body.comments[1]?.commentId).toBe(otherUserCommentId);
        expect(page1Body.nextCursor).toBe(otherUserCommentId);

        // Page 2 using cursor (returns 1st comment and null nextCursor)
        const page2 = await fastify.inject({
            path: `/api/anime/${animeId}/comment?cursor=${page1Body.nextCursor}&limit=2`,
            method: "GET",
        });
        expect(page2.statusCode).toBe(200);
        const page2Body = page2.json<{
            ok: true;
            comments: Array<{ commentId: string; content: string }>;
            nextCursor: string | null;
        }>();
        expect(page2Body.ok).toBe(true);
        expect(page2Body.comments).toHaveLength(1);
        expect(page2Body.comments[0]?.commentId).toBe(userCommentId);
        expect(page2Body.nextCursor).toBeNull();

        // Explicit cursor=0 returns full list up to default limit
        const allRes = await fastify.inject({
            path: `/api/anime/${animeId}/comment?cursor=0`,
            method: "GET",
        });
        expect(allRes.statusCode).toBe(200);
        expect(allRes.json<{ comments: unknown[] }>().comments).toHaveLength(3);

        // Empty list for anime without comments
        const emptyAnime = await fastify.inject({
            path: `/api/anime/${crypto.randomUUID()}/comment`,
            method: "GET",
        });
        expect(emptyAnime.statusCode).toBe(200);
        expect(emptyAnime.json()).toEqual({ ok: true, comments: [], nextCursor: null });

        // Query & params validation errors
        const badAnimeId = await fastify.inject({
            path: "/api/anime/not-a-uuid/comment",
            method: "GET",
        });
        expect(badAnimeId.statusCode).toBe(400);

        const limitTooHigh = await fastify.inject({
            path: `/api/anime/${animeId}/comment?limit=51`,
            method: "GET",
        });
        expect(limitTooHigh.statusCode).toBe(400);

        const limitZero = await fastify.inject({
            path: `/api/anime/${animeId}/comment?limit=0`,
            method: "GET",
        });
        expect(limitZero.statusCode).toBe(400);

        const invalidCursor = await fastify.inject({
            path: `/api/anime/${animeId}/comment?cursor=-10`,
            method: "GET",
        });
        expect(invalidCursor.statusCode).toBe(400);

        const unknownQuery = await fastify.inject({
            path: `/api/anime/${animeId}/comment?unknown=1`,
            method: "GET",
        });
        expect(unknownQuery.statusCode).toBe(400);
    });

    test("PUT /api/anime/:animeId/comment/:commentId - ownership and validation", async () => {
        const { fastify, regularAuth, adminAuth, bannedAuth, animeId, otherAnimeId } = await beforeValues;

        // Unauthenticated
        const unauth = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "Edited" },
        });
        expect(unauth.statusCode).toBe(403);

        // Banned owner cannot update
        const banned = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "Edited" },
            headers: { authorization: bannedAuth.authorization },
        });
        expect(banned.statusCode).toBe(403);

        // Invalid commentId ("0" violates ^[1-9][0-9]*$)
        const invalidId = await fastify.inject({
            path: `/api/anime/${animeId}/comment/0`,
            method: "PUT",
            payload: { content: "Edited" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(invalidId.statusCode).toBe(400);
        expect(invalidId.json()).toMatchObject({ ok: false, error: "validation" });

        // Whitespace-only content
        const whitespaceOnly = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "    " },
            headers: { authorization: regularAuth.authorization },
        });
        expect(whitespaceOnly.statusCode).toBe(400);
        expect(whitespaceOnly.json()).toMatchObject({ ok: false, error: "comment-invalid" });

        // Regular user cannot edit another user's comment
        const notOwner = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${otherUserCommentId}`,
            method: "PUT",
            payload: { content: "Trying to edit foreign comment" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(notOwner.statusCode).toBe(404);
        expect(notOwner.json()).toMatchObject({ ok: false, error: "comment-not-found" });

        // Admin cannot edit another user's comment (only author can update content)
        const adminEditForeign = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "Admin edit attempt" },
            headers: { authorization: adminAuth.authorization },
        });
        expect(adminEditForeign.statusCode).toBe(404);
        expect(adminEditForeign.json()).toMatchObject({ ok: false, error: "comment-not-found" });

        // Wrong animeId for an existing comment
        const wrongAnime = await fastify.inject({
            path: `/api/anime/${otherAnimeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "Wrong anime ID" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(wrongAnime.statusCode).toBe(404);
        expect(wrongAnime.json()).toMatchObject({ ok: false, error: "comment-not-found" });

        // Non-existent commentId
        const nonExistent = await fastify.inject({
            path: `/api/anime/${animeId}/comment/999999999`,
            method: "PUT",
            payload: { content: "Ghost comment" },
            headers: { authorization: regularAuth.authorization },
        });
        expect(nonExistent.statusCode).toBe(404);

        // Successful update by owner
        const response = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "  Edited anime episode comment!  " },
            headers: { authorization: regularAuth.authorization },
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
            ok: true,
            commentId: userCommentId,
            content: "Edited anime episode comment!",
            isEdited: true,
            author: {
                userId: regularAuth.user.userId,
                nickname: regularAuth.user.nickname,
                avatarId: null,
            },
        });
    });

    test("DELETE /api/anime/:animeId/comment/:commentId - owner and admin permissions", async () => {
        const { fastify, regularAuth, adminAuth, bannedAuth, animeId, otherAnimeId } = await beforeValues;

        // Unauthenticated
        const unauth = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "DELETE",
        });
        expect(unauth.statusCode).toBe(403);

        // Banned user cannot delete
        const banned = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "DELETE",
            headers: { authorization: bannedAuth.authorization },
        });
        expect(banned.statusCode).toBe(403);

        // Invalid commentId format
        const invalidId = await fastify.inject({
            path: `/api/anime/${animeId}/comment/0`,
            method: "DELETE",
            headers: { authorization: regularAuth.authorization },
        });
        expect(invalidId.statusCode).toBe(400);

        // Regular user cannot delete another user's comment
        const forbiddenByOwnership = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${otherUserCommentId}`,
            method: "DELETE",
            headers: { authorization: regularAuth.authorization },
        });
        expect(forbiddenByOwnership.statusCode).toBe(404);
        expect(forbiddenByOwnership.json()).toMatchObject({ ok: false, error: "comment-not-found" });

        // Wrong animeId
        const wrongAnime = await fastify.inject({
            path: `/api/anime/${otherAnimeId}/comment/${userCommentId}`,
            method: "DELETE",
            headers: { authorization: regularAuth.authorization },
        });
        expect(wrongAnime.statusCode).toBe(404);

        // Owner deletes own comment
        const ownerDelete = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "DELETE",
            headers: { authorization: regularAuth.authorization },
        });
        expect(ownerDelete.statusCode).toBe(204);
        expect(ownerDelete.body).toBe("");

        // Deleting already removed comment returns 404
        const repeatDelete = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${userCommentId}`,
            method: "DELETE",
            headers: { authorization: regularAuth.authorization },
        });
        expect(repeatDelete.statusCode).toBe(404);

        // Admin deletes another user's comment
        const adminDelete = await fastify.inject({
            path: `/api/anime/${animeId}/comment/${otherUserCommentId}`,
            method: "DELETE",
            headers: { authorization: adminAuth.authorization },
        });
        expect(adminDelete.statusCode).toBe(204);
        expect(adminDelete.body).toBe("");

        // Verify only thirdCommentId remains on this anime
        const listAfter = await fastify.inject({
            path: `/api/anime/${animeId}/comment`,
            method: "GET",
        });
        expect(listAfter.statusCode).toBe(200);
        const listAfterBody = listAfter.json<{
            ok: true;
            comments: Array<{ commentId: string }>;
            nextCursor: string | null;
        }>();
        expect(listAfterBody.comments).toHaveLength(1);
        expect(listAfterBody.comments[0]?.commentId).toBe(thirdCommentId);
        expect(listAfterBody.nextCursor).toBeNull();
    });
});
