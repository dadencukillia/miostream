import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { fastifyInstance } from "../fastifyHelper";
import { newTestAuth, wipeOAuthUsers } from "../oauthHelper";
import { FastifyInstance } from "fastify";
import { generateAccessToken } from "@/api/auth/services/token.service";
import { newUserSession } from "@/api/auth/services/session.service";

describe("user routes", () => {
    let fastify: FastifyInstance;
    let userId: string = "";
    let userAuth: string = "";
    let adminAuth: string = "";

    beforeAll(async () => {
        fastify = await fastifyInstance();
        await wipeOAuthUsers();
    });

    afterAll(async () => {
        await wipeOAuthUsers();
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
            path: "/api/user",
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

        const session = await newUserSession(fastify.pg, userId);
        userAuth = await generateAccessToken(session.sessionId, session.userId);

        adminAuth = (await newTestAuth("admin", "active")).authorization;
    });

    test("reject duplicate registration", async () => {
        const response = await fastify.inject({
            path: "/api/user",
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
            path: "/api/user",
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
            path: "/api/user",
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
            path: `/api/user/${userId}`,
            method: "GET",
        });
        expect(byCanonicalId.statusCode).toBe(200);
        expect(byCanonicalId.json()).toMatchObject({
            userId,
            nickname: "tester_route",
        });

        const compactUpperId = userId.replace(/-/g, "").toUpperCase();
        const byCompactId = await fastify.inject({
            path: `/api/user/${compactUpperId}`,
            method: "GET",
        });
        expect(byCompactId.statusCode).toBe(200);
        expect(byCompactId.json()).toMatchObject({
            userId,
            nickname: "tester_route",
        });

        const byNickname = await fastify.inject({
            path: "/api/user/tester_route",
            method: "GET",
        });
        expect(byNickname.statusCode).toBe(200);
        expect(byNickname.json()).toMatchObject({
            userId,
            nickname: "tester_route",
        });

        const notFound = await fastify.inject({
            path: "/api/user/non_existent_user",
            method: "GET",
        });
        expect(notFound.statusCode).toBe(404);
        expect(notFound.json()).toMatchObject({ ok: false });
    });

    test("update user status and role (admin only)", async () => {
        const forbiddenStatus = await fastify.inject({
            path: `/api/user/${userId}/status`,
            method: "PATCH",
            payload: { userStatus: "banned" },
            headers: { authorization: userAuth },
        });
        expect(forbiddenStatus.statusCode).toBe(403);

        const statusResponse = await fastify.inject({
            path: `/api/user/${userId}/status`,
            method: "PATCH",
            payload: { userStatus: "banned" },
            headers: { authorization: adminAuth },
        });
        expect(statusResponse.statusCode).toBe(200);
        expect(statusResponse.json()).toMatchObject({ userStatus: "banned" });

        const roleResponse = await fastify.inject({
            path: `/api/user/${userId}/role`,
            method: "PATCH",
            payload: { userRole: "admin" },
            headers: { authorization: adminAuth },
        });
        expect(roleResponse.statusCode).toBe(200);
        expect(roleResponse.json()).toMatchObject({ userRole: "admin" });
    });

    test("list user links (public)", async () => {
        const response = await fastify.inject({
            path: `/api/user/${userId}/links`,
            method: "GET",
        });

        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({ ok: true, links: [] });
    });

    test("delete user (admin only)", async () => {
        const forbiddenDelete = await fastify.inject({
            path: `/api/user/${userId}`,
            method: "DELETE",
            headers: { authorization: userAuth },
        });
        expect(forbiddenDelete.statusCode).toBe(403);

        const response = await fastify.inject({
            path: `/api/user/${userId}`,
            method: "DELETE",
            headers: { authorization: adminAuth },
        });

        expect(response.statusCode).toBe(204);
        expect(response.body).toBe("");

        const checkById = await fastify.inject({
            path: `/api/user/${userId}`,
            method: "GET",
        });
        expect(checkById.statusCode).toBe(404);

        const checkByNickname = await fastify.inject({
            path: "/api/user/tester_route",
            method: "GET",
        });
        expect(checkByNickname.statusCode).toBe(404);
    });
});
