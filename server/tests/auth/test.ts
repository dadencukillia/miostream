import Fastify from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import * as config from "../../src/config";

import { resetMockPrisma } from "../../src/api/auth/prisma/mock";
import { getGoogleAuthUrl, saveGoogleUser, verifyToken } from "../../src/api/auth/service";
import authPlugin from "../../src/api/auth/plugin";

const app = Fastify();

describe("auth tests", () => {
	beforeAll(async () => {
		app.register(authPlugin, { prefix: "/auth" });
		await app.ready();
	});

	beforeEach(() => {
		resetMockPrisma();
	});

	afterAll(async () => {
		await app.close();
	});

	describe("auth service", () => {
	test("creates and verifies a JWT for a Google user", async () => {
		const { token, user } = await saveGoogleUser({ 
			email: "user@example.com",
			name: "Test User" });

		expect(token.split(".")).toHaveLength(3);
		expect(verifyToken(token)).toEqual({ userId: user.id });
	});

	test("rejects a modified JWT", async () => {
		const { token } = await saveGoogleUser({ email: "user@example.com" });
		const modifiedToken = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

		expect(verifyToken(modifiedToken)).toBeNull();
	});

	test("builds the Google OAuth URL with the callback state", () => {
		const url = new URL(getGoogleAuthUrl("oauth-state"));

		expect(url.origin).toBe("https://accounts.google.com");
		expect(url.searchParams.get("client_id")).toBe(config.GOOGLE_CLIENT_ID);
		expect(url.searchParams.get("redirect_uri")).toBe(config.GOOGLE_REDIRECT_URI);
		expect(url.searchParams.get("state")).toBe("oauth-state");
		expect(url.searchParams.get("access_type")).toBe("offline");
	});

	test("accepts a Google refresh token without exposing it in the JWT", async () => {
		const { token } = await saveGoogleUser({
			email: "user@example.com",
			refreshToken: "google-refresh-token",
		});

		expect(token).not.toContain("google-refresh-token");
		expect(verifyToken(token)).toEqual({ userId: 1 });
	});
});

describe("auth routes", () => {
	test("protects /me without a JWT cookie", async () => {
		const response = await app.inject({ method: "GET", url: "/auth/me" });

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toEqual({ error: "unauthorized" });
	});

	test("returns the authenticated user from /me", async () => {
		const { token } = await saveGoogleUser({ email: "user@example.com" });

		const response = await app.inject({
			method: "GET",
			url: "/auth/me",
			headers: { cookie: `${config.AUTH_COOKIE_NAME}=${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toEqual({ userId: 1 });
	});

	test("clears the auth cookie on logout", async () => {
		const response = await app.inject({
			method: "POST",
			url: "/auth/logout"
		});

		expect(response.statusCode).toBe(204);
		const setCookie = response.headers["set-cookie"];
		const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
		expect(cookies).toContain(`${config.AUTH_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
	});
});
});