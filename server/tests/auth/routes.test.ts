import { afterAll, describe, expect, test } from "bun:test";
import * as config from "@config";
import * as userService from "@/api/user/services/user.service";
import { fastifyInstance } from "../fastifyHelper";
import { newTestAuth, newTestUser, wipeOAuthUsers } from "../oauthHelper";
import { beforeAllReturning } from "../testHelper";

describe("auth credentials routes", () => {
    const userPayload = {
        email: "auth_route@miostream.dev",
        nickname: "auth_tester",
        fullName: "Auth Tester",
        password: "InitialPassword123!",
    };

    const updatedPassword = "UpdatedPassword456!";
    let registeredUserId = "";
    let accessToken = "";

    const beforeValues = beforeAllReturning(async () => {
        const fastify = await fastifyInstance();
        await wipeOAuthUsers();
        return { fastify };
    });

    afterAll(async () => {
        const { fastify } = await beforeValues;
        await wipeOAuthUsers();
        await fastify.close();
    });

    test("POST /api/auth/register - validation, conflicts, and session creation", async () => {
        const { fastify } = await beforeValues;

        // Schema validation errors
        const invalidSchema = await fastify.inject({
            path: "/api/auth/register",
            method: "POST",
            payload: {
                email: "not-an-email",
                nickname: "ab",
                fullName: "A",
                password: "short",
            },
        });
        expect(invalidSchema.statusCode).toBe(400);
        expect(invalidSchema.json()).toMatchObject({ ok: false, error: "validation" });

        // Reserved nickname rejected
        const reservedNickname = await fastify.inject({
            path: "/api/auth/register",
            method: "POST",
            payload: {
                ...userPayload,
                nickname: "admin",
            },
        });
        expect(reservedNickname.statusCode).toBe(400);
        expect(reservedNickname.json()).toMatchObject({ ok: false, error: "user-invalid" });

        // Successful registration
        const response = await fastify.inject({
            path: "/api/auth/register",
            method: "POST",
            payload: userPayload,
        });

        expect(response.statusCode).toBe(201);
        const body = response.json<{
            ok: true;
            userId: string;
            email: string;
            nickname: string;
            fullName: string;
            userRole: string;
            userStatus: string;
        }>();

        registeredUserId = body.userId;

        expect(body).toMatchObject({
            ok: true,
            email: userPayload.email,
            nickname: userPayload.nickname,
            fullName: userPayload.fullName,
            userRole: "user",
            userStatus: "active",
        });
        expect(body).not.toHaveProperty("passwordHash");
        expect(body).not.toHaveProperty("googleId");

        // Session cookie is set and exchanges for an access token
        const sessionCookie = response.cookies.find(
            (c) => c.name === config.AuthAdjustments.SESSION_COOKIE_NAME
        );
        expect(sessionCookie).toBeDefined();
        expect(sessionCookie?.value).toBeString();
        expect(sessionCookie?.httpOnly).toBe(true);

        const tokenRes = await fastify.inject({
            path: "/api/auth/session/token",
            method: "GET",
            headers: {
                cookie: `${sessionCookie!.name}=${sessionCookie!.value}`,
            },
        });
        expect(tokenRes.statusCode).toBe(200);
        const tokenBody = tokenRes.json<{ ok: true; accessToken: string; tokenType: string }>();
        expect(tokenBody).toMatchObject({
            ok: true,
            tokenType: "Bearer",
        });
        accessToken = tokenBody.accessToken;

        // Duplicate email conflict
        const duplicateEmail = await fastify.inject({
            path: "/api/auth/register",
            method: "POST",
            payload: {
                ...userPayload,
                email: "AUTH_ROUTE@MIOSTREAM.DEV",
                nickname: "another_nick",
            },
        });
        expect(duplicateEmail.statusCode).toBe(409);
        expect(duplicateEmail.json()).toMatchObject({ ok: false, error: "user-email-already-taken" });

        // Duplicate nickname conflict (case-insensitive)
        const duplicateNickname = await fastify.inject({
            path: "/api/auth/register",
            method: "POST",
            payload: {
                ...userPayload,
                email: "unique_mail@miostream.dev",
                nickname: "AUTH_TESTER",
            },
        });
        expect(duplicateNickname.statusCode).toBe(409);
        expect(duplicateNickname.json()).toMatchObject({ ok: false, error: "user-nickname-already-taken" });
    });

    test("POST /api/auth/login - email/nickname login, invalid credentials, and banned status", async () => {
        const { fastify } = await beforeValues;

        // Login via email (case-insensitive)
        const loginByEmail = await fastify.inject({
            path: "/api/auth/login",
            method: "POST",
            payload: {
                identifier: "AUTH_ROUTE@MIOSTREAM.DEV",
                password: userPayload.password,
            },
        });
        expect(loginByEmail.statusCode).toBe(200);
        expect(loginByEmail.json()).toMatchObject({
            ok: true,
            userId: registeredUserId,
            email: userPayload.email,
            nickname: userPayload.nickname,
        });
        const emailSessionCookie = loginByEmail.cookies.find(
            (c) => c.name === config.AuthAdjustments.SESSION_COOKIE_NAME
        );
        expect(emailSessionCookie?.value).toBeString();

        // Login via nickname (case-insensitive)
        const loginByNickname = await fastify.inject({
            path: "/api/auth/login",
            method: "POST",
            payload: {
                identifier: "Auth_Tester",
                password: userPayload.password,
            },
        });
        expect(loginByNickname.statusCode).toBe(200);
        expect(loginByNickname.json()).toMatchObject({
            ok: true,
            userId: registeredUserId,
        });

        // Wrong password
        const wrongPassword = await fastify.inject({
            path: "/api/auth/login",
            method: "POST",
            payload: {
                identifier: userPayload.email,
                password: "WrongPassword123!",
            },
        });
        expect(wrongPassword.statusCode).toBe(401);
        expect(wrongPassword.json()).toMatchObject({ ok: false, error: "auth-invalid-credentials" });

        // Non-existent user returns the same 401 error
        const unknownUser = await fastify.inject({
            path: "/api/auth/login",
            method: "POST",
            payload: {
                identifier: "missing_user@miostream.dev",
                password: userPayload.password,
            },
        });
        expect(unknownUser.statusCode).toBe(401);
        expect(unknownUser.json()).toMatchObject({ ok: false, error: "auth-invalid-credentials" });

        // Whitespace-only identifier
        const blankIdentifier = await fastify.inject({
            path: "/api/auth/login",
            method: "POST",
            payload: {
                identifier: "   ",
                password: userPayload.password,
            },
        });
        expect(blankIdentifier.statusCode).toBe(401);
        expect(blankIdentifier.json()).toMatchObject({ ok: false, error: "auth-invalid-credentials" });

        // OAuth-only account without password cannot login via password
        await newTestUser(
            fastify.pg,
            "oauth_only_user",
            "OAuth User",
            "oauth_only@miostream.dev",
            "google-sub-12345",
            "user",
            "active"
        );
        const oauthLoginAttempt = await fastify.inject({
            path: "/api/auth/login",
            method: "POST",
            payload: {
                identifier: "oauth_only@miostream.dev",
                password: userPayload.password,
            },
        });
        expect(oauthLoginAttempt.statusCode).toBe(401);
        expect(oauthLoginAttempt.json()).toMatchObject({ ok: false, error: "auth-invalid-credentials" });

        // Banned user with valid credentials receives 403
        const bannedUser = await userService.createUser(fastify.pg, {
            email: "banned_login@miostream.dev",
            nickname: "banned_login",
            fullName: "Banned User",
            password: userPayload.password,
        });
        await userService.updateUserStatus(fastify.pg, bannedUser.userId, "banned");

        const bannedLoginAttempt = await fastify.inject({
            path: "/api/auth/login",
            method: "POST",
            payload: {
                identifier: "banned_login@miostream.dev",
                password: userPayload.password,
            },
        });
        expect(bannedLoginAttempt.statusCode).toBe(403);
        expect(bannedLoginAttempt.json()).toMatchObject({ ok: false, error: "auth-no-session-access" });
    });

    test("PATCH /api/auth/password - auth, validation, and credential rotation", async () => {
        const { fastify } = await beforeValues;

        // Unauthenticated request
        const unauth = await fastify.inject({
            path: "/api/auth/password",
            method: "PATCH",
            payload: {
                oldPassword: userPayload.password,
                newPassword: updatedPassword,
            },
        });
        expect(unauth.statusCode).toBe(403);

        // Invalid access token
        const invalidToken = await fastify.inject({
            path: "/api/auth/password",
            method: "PATCH",
            payload: {
                oldPassword: userPayload.password,
                newPassword: updatedPassword,
            },
            headers: {
                authorization: "Bearer invalid.token.value",
            },
        });
        expect(invalidToken.statusCode).toBe(401);
        expect(invalidToken.json()).toMatchObject({ ok: false, error: "auth-invalid-access-token" });

        // New password matches old password
        const samePassword = await fastify.inject({
            path: "/api/auth/password",
            method: "PATCH",
            payload: {
                oldPassword: userPayload.password,
                newPassword: userPayload.password,
            },
            headers: {
                authorization: `Bearer ${accessToken}`,
            },
        });
        expect(samePassword.statusCode).toBe(400);
        expect(samePassword.json()).toMatchObject({ ok: false, error: "user-invalid" });

        // Wrong current password
        const wrongOldPassword = await fastify.inject({
            path: "/api/auth/password",
            method: "PATCH",
            payload: {
                oldPassword: "WrongCurrentPassword!",
                newPassword: updatedPassword,
            },
            headers: {
                authorization: `Bearer ${accessToken}`,
            },
        });
        expect(wrongOldPassword.statusCode).toBe(400);
        expect(wrongOldPassword.json()).toMatchObject({ ok: false, error: "user-invalid" });

        // OAuth-only user without password receives 404
        const oauthAuth = await newTestAuth("user", "active");
        const oauthPasswordChange = await fastify.inject({
            path: "/api/auth/password",
            method: "PATCH",
            payload: {
                oldPassword: userPayload.password,
                newPassword: updatedPassword,
            },
            headers: {
                authorization: oauthAuth.authorization,
            },
        });
        expect(oauthPasswordChange.statusCode).toBe(404);
        expect(oauthPasswordChange.json()).toMatchObject({ ok: false, error: "user-db-data-not-found" });

        // Successful password change
        const success = await fastify.inject({
            path: "/api/auth/password",
            method: "PATCH",
            payload: {
                oldPassword: userPayload.password,
                newPassword: updatedPassword,
            },
            headers: {
                authorization: `Bearer ${accessToken}`,
            },
        });
        expect(success.statusCode).toBe(204);
        expect(success.body).toBe("");

        // Old password no longer works
        const loginWithOld = await fastify.inject({
            path: "/api/auth/login",
            method: "POST",
            payload: {
                identifier: userPayload.email,
                password: userPayload.password,
            },
        });
        expect(loginWithOld.statusCode).toBe(401);

        // New password succeeds
        const loginWithNew = await fastify.inject({
            path: "/api/auth/login",
            method: "POST",
            payload: {
                identifier: userPayload.email,
                password: updatedPassword,
            },
        });
        expect(loginWithNew.statusCode).toBe(200);
        expect(loginWithNew.json()).toMatchObject({
            ok: true,
            userId: registeredUserId,
        });
    });
});
