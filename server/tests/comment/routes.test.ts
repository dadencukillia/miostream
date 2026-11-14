import connector from "@utils/connector";
import { PostgresConnection } from "@/connections/pg";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import Fastify, { type FastifyInstance } from "fastify";
import commentPlugin from "@/api/comment/comment.plugin";
import * as userService from "@/api/user/services/user.service";
import { grantAuthMiddleware } from "@/api/auth/auth.middleware";

describe("comment routes", () => {
    let fastify: FastifyInstance;
    let authUserId: string = "";
    let authAdminId: string = "";
    let otherUserId: string = "";
    let animeId: string = "";
    let otherAnimeId: string = "";
    let userCommentId: string = "";
    let otherUserCommentId: string = "";

    beforeAll(async () => {
        fastify = Fastify({
            logger: false,
            pluginTimeout: 0,
            ajv: {
                customOptions: {
                    unicodeRegExp: true,
                    removeAdditional: false,
                },
            },
        });

        await fastify.register(connector, {
            retries: 3,
            interval: 15 * 1000,
            connections: [PostgresConnection],
        });

        await fastify.register(commentPlugin, { prefix: "/anime/:animeId/comment" });

        fastify.get("/_test_auth", { preHandler: grantAuthMiddleware() as any }, async (req) => ({
            userId: req.auth?.userId,
        }));

        const userAuthRes = await fastify.inject({
            path: "/_test_auth",
            method: "GET",
            headers: { authorization: "Bearer user" },
        });
        authUserId = userAuthRes.json<{ userId: string }>().userId;

        const adminAuthRes = await fastify.inject({
            path: "/_test_auth",
            method: "GET",
            headers: { authorization: "Bearer admin" },
        });
        authAdminId = adminAuthRes.json<{ userId: string }>().userId;

        await fastify.pg.query("DELETE FROM public.comments;");
        await fastify.pg.query("DELETE FROM public.animes;");
        await fastify.pg.query("DELETE FROM public.users;");

        const regularUser = await userService.createUser(fastify.pg, {
            nickname: "route_commenter",
            fullName: "Route Commenter",
            email: "route_commenter@miostream.dev",
            password: "password123",
        });
        await fastify.pg.query("UPDATE public.users SET user_id = $1 WHERE user_id = $2;", [
            authUserId,
            regularUser.userId,
        ]);

        if (authAdminId && authAdminId !== authUserId) {
            const adminUser = await userService.createUser(fastify.pg, {
                nickname: "route_admin",
                fullName: "Route Admin",
                email: "route_admin@miostream.dev",
                password: "password123",
            });
            await fastify.pg.query("UPDATE public.users SET user_id = $1 WHERE user_id = $2;", [
                authAdminId,
                adminUser.userId,
            ]);
        }

        const thirdUser = await userService.createUser(fastify.pg, {
            nickname: "route_third_user",
            fullName: "Route Third User",
            email: "route_third@miostream.dev",
            password: "password123",
        });
        otherUserId = thirdUser.userId;

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
    });

    afterAll(async () => {
        await fastify.pg.query("DELETE FROM public.comments;");
        await fastify.pg.query("DELETE FROM public.animes;");
        await fastify.pg.query("DELETE FROM public.users;");
        await fastify.close();
    });

    test("post comment (auth required and validation)", async () => {
        const unauth = await fastify.inject({
            path: `/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "Unauthorized comment" },
        });
        expect(unauth.statusCode).toBe(403);

        const whitespaceOnly = await fastify.inject({
            path: `/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "    " },
            headers: { authorization: "Bearer user" },
        });
        expect(whitespaceOnly.statusCode).toBe(400);
        expect(whitespaceOnly.json()).toMatchObject({ ok: false });

        const missingAnime = await fastify.inject({
            path: `/anime/${crypto.randomUUID()}/comment`,
            method: "POST",
            payload: { content: "Comment on missing anime" },
            headers: { authorization: "Bearer user" },
        });
        expect(missingAnime.statusCode).toBe(404);
        expect(missingAnime.json()).toMatchObject({ ok: false });

        const response = await fastify.inject({
            path: `/anime/${animeId}/comment`,
            method: "POST",
            payload: { content: "  Awesome anime episode!  " },
            headers: { authorization: "Bearer user" },
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
            commentId: userCommentId,
            content: "Awesome anime episode!",
            isEdited: false,
            author: {
                userId: authUserId,
                nickname: "route_commenter",
                avatarId: null,
            },
        });
    });

    test("get comments (public and paginated)", async () => {
        // Seed a second comment authored by otherUserId
        const seeded = await fastify.pg.query<{ comment_id: string }>(
            "INSERT INTO public.comments (anime_id, author_id, content) VALUES ($1, $2, $3) RETURNING comment_id;",
            [animeId, otherUserId, "Second user comment"]
        );
        otherUserCommentId = String(seeded.rows[0]!.comment_id);

        const page1 = await fastify.inject({
            path: `/anime/${animeId}/comment?limit=1`,
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
            path: `/anime/${animeId}/comment?cursor=${page1Body.nextCursor}&limit=1`,
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
            path: `/anime/${animeId}/comment?cursor=${page2Body.nextCursor}&limit=1`,
            method: "GET",
        });
        expect(page3.statusCode).toBe(200);
        expect(page3.json()).toEqual({ comments: [], nextCursor: null });

        const invalidParams = await fastify.inject({
            path: `/anime/not-a-uuid/comment?limit=100`,
            method: "GET",
        });
        expect(invalidParams.statusCode).toBe(400);
        expect(invalidParams.json()).toMatchObject({ ok: false });
    });

    test("update comment (owner only)", async () => {
        const unauth = await fastify.inject({
            path: `/anime/${animeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "Edited" },
        });
        expect(unauth.statusCode).toBe(403);

        const invalidId = await fastify.inject({
            path: `/anime/${animeId}/comment/0`,
            method: "PUT",
            payload: { content: "Edited" },
            headers: { authorization: "Bearer user" },
        });
        expect(invalidId.statusCode).toBe(400);

        const notOwner = await fastify.inject({
            path: `/anime/${animeId}/comment/${otherUserCommentId}`,
            method: "PUT",
            payload: { content: "Trying to edit foreign comment" },
            headers: { authorization: "Bearer user" },
        });
        expect(notOwner.statusCode).toBe(404);
        expect(notOwner.json()).toMatchObject({ ok: false });

        const wrongAnime = await fastify.inject({
            path: `/anime/${otherAnimeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "Wrong anime ID" },
            headers: { authorization: "Bearer user" },
        });
        expect(wrongAnime.statusCode).toBe(404);

        const response = await fastify.inject({
            path: `/anime/${animeId}/comment/${userCommentId}`,
            method: "PUT",
            payload: { content: "  Edited anime episode comment!  " },
            headers: { authorization: "Bearer user" },
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toMatchObject({
            commentId: userCommentId,
            content: "Edited anime episode comment!",
            isEdited: true,
        });
    });

    test("delete comment (owner and admin)", async () => {
        const unauth = await fastify.inject({
            path: `/anime/${animeId}/comment/${userCommentId}`,
            method: "DELETE",
        });
        expect(unauth.statusCode).toBe(403);

        // Regular user cannot delete another user's comment
        const forbiddenByOwnership = await fastify.inject({
            path: `/anime/${animeId}/comment/${otherUserCommentId}`,
            method: "DELETE",
            headers: { authorization: "Bearer user" },
        });
        expect(forbiddenByOwnership.statusCode).toBe(404);
        expect(forbiddenByOwnership.json()).toMatchObject({ ok: false });

        // Owner deletes own comment
        const ownerDelete = await fastify.inject({
            path: `/anime/${animeId}/comment/${userCommentId}`,
            method: "DELETE",
            headers: { authorization: "Bearer user" },
        });
        expect(ownerDelete.statusCode).toBe(204);
        expect(ownerDelete.body).toBe("");

        // Admin deletes another user's comment
        const adminDelete = await fastify.inject({
            path: `/anime/${animeId}/comment/${otherUserCommentId}`,
            method: "DELETE",
            headers: { authorization: "Bearer admin" },
        });
        expect(adminDelete.statusCode).toBe(204);
        expect(adminDelete.body).toBe("");

        // Verify list is now empty
        const listAfter = await fastify.inject({
            path: `/anime/${animeId}/comment`,
            method: "GET",
        });
        expect(listAfter.statusCode).toBe(200);
        expect(listAfter.json()).toEqual({ comments: [], nextCursor: null });
    });
});