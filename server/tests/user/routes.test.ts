import connector from "@utils/connector";
import { PostgresConnection } from "@/connections/pg";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import Fastify, { type FastifyInstance } from "fastify";
import userPlugin from "@/api/user/user.plugin";

describe("user routes", () => {
    let fastify: FastifyInstance;
    let userId: string = "";

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

        await fastify.register(userPlugin, { prefix: "/user" });

        await fastify.pg.query("DELETE FROM public.users;");
    });

    afterAll(async () => {
        await fastify.pg.query("DELETE FROM public.users;");
        await fastify.close();
    });

    test("register user", async () => {
        const userData = {
            nickname: "tester_route",
            fullName: "Route Tester",
            email: "route_test@miostream.dev",
            password: "password123",
        };

        const response = await fastify.inject({
            path: "/user",
            method: "POST",
            payload: userData,
        });

        expect(response.statusCode).toBe(201);
        const body = response.json<{ userId: string; nickname: string; email: string }>();
        userId = body.userId;

        expect(body).toMatchObject({
            nickname: userData.nickname,
            fullName: userData.fullName,
            email: userData.email,
            userRole: "user",
            userStatus: "active",
            avatarId: null,
        });
        expect(body).not.toHaveProperty("passwordHash");
        expect(body).not.toHaveProperty("googleId");
    });

    test("reject duplicate registration", async () => {
        const response = await fastify.inject({
            path: "/user",
            method: "POST",
            payload: {
                nickname: "tester_route",
                fullName: "Another Jack",
                email: "another@miostream.dev",
                password: "password123",
            },
        });

        expect(response.statusCode).toBe(409);
        expect(response.json()).toMatchObject({ ok: false });
    });

    test("reject invalid registration payload and reserved nicknames", async () => {
        const invalidPayload = await fastify.inject({
            path: "/user",
            method: "POST",
            payload: {
                nickname: "t",
                fullName: "T",
                email: "not-an-email",
            },
        });

        expect(invalidPayload.statusCode).toBe(400);
        expect(invalidPayload.json()).toMatchObject({ ok: false });

        const reservedNickname = await fastify.inject({
            path: "/user",
            method: "POST",
            payload: {
                nickname: "Links",
                fullName: "Reserved Nick",
                email: "reserved@miostream.dev",
                password: "password123",
            },
        });

        expect(reservedNickname.statusCode).toBe(400);
        expect(reservedNickname.json()).toMatchObject({ ok: false });
    });

    test("get user by id and nickname (public)", async () => {
        const byCanonicalId = await fastify.inject({
            path: `/user/${userId}`,
            method: "GET",
        });
        expect(byCanonicalId.statusCode).toBe(200);
        expect(byCanonicalId.json()).toMatchObject({
            userId,
            nickname: "tester_route",
        });

        const compactUpperId = userId.replace(/-/g, "").toUpperCase();
        const byCompactId = await fastify.inject({
            path: `/user/${compactUpperId}`,
            method: "GET",
        });
        expect(byCompactId.statusCode).toBe(200);
        expect(byCompactId.json()).toMatchObject({
            userId,
            nickname: "tester_route",
        });

        const byNickname = await fastify.inject({
            path: "/user/tester_route",
            method: "GET",
        });
        expect(byNickname.statusCode).toBe(200);
        expect(byNickname.json()).toMatchObject({
            userId,
            nickname: "tester_route",
        });

        const notFound = await fastify.inject({
            path: "/user/non_existent_user",
            method: "GET",
        });
        expect(notFound.statusCode).toBe(404);
        expect(notFound.json()).toMatchObject({ ok: false });
    });

    test("update user status and role (admin only)", async () => {
        const forbiddenStatus = await fastify.inject({
            path: `/user/${userId}/status`,
            method: "PATCH",
            payload: { userStatus: "banned" },
            headers: { authorization: "Bearer user" },
        });
        expect(forbiddenStatus.statusCode).toBe(403);

        const statusResponse = await fastify.inject({
            path: `/user/${userId}/status`,
            method: "PATCH",
            payload: { userStatus: "banned" },
            headers: { authorization: "Bearer admin" },
        });
        expect(statusResponse.statusCode).toBe(200);
        expect(statusResponse.json()).toMatchObject({ userStatus: "banned" });

        const roleResponse = await fastify.inject({
            path: `/user/${userId}/role`,
            method: "PATCH",
            payload: { userRole: "admin" },
            headers: { authorization: "Bearer admin" },
        });
        expect(roleResponse.statusCode).toBe(200);
        expect(roleResponse.json()).toMatchObject({ userRole: "admin" });
    });

    test("list user links (public)", async () => {
        const response = await fastify.inject({
            path: `/user/${userId}/links`,
            method: "GET",
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual([]);
    });

    test("delete user (admin only)", async () => {
        const forbiddenDelete = await fastify.inject({
            path: `/user/${userId}`,
            method: "DELETE",
            headers: { authorization: "Bearer user" },
        });
        expect(forbiddenDelete.statusCode).toBe(403);

        const response = await fastify.inject({
            path: `/user/${userId}`,
            method: "DELETE",
            headers: { authorization: "Bearer admin" },
        });

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe("");

        const checkById = await fastify.inject({
            path: `/user/${userId}`,
            method: "GET",
        });
        expect(checkById.statusCode).toBe(404);

        const checkByNickname = await fastify.inject({
            path: "/user/tester_route",
            method: "GET",
        });
        expect(checkByNickname.statusCode).toBe(404);
    });
});
