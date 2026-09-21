import Fastify from "fastify";
import { beforeEach, describe, expect, test } from "bun:test";

process.env.AUTH_JWT_SECRET = "test-jwt-secret";
process.env.AUTH_COOKIE_NAME = "auth_token";
process.env.GOOGLE_CLIENT_ID = "google-client-id";
process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
process.env.GOOGLE_REDIRECT_URI = "http://localhost:8080/api/auth/google/callback";

import { resetMockPrisma } from "../../src/api/auth/prisma/mock";
import { handleGoogleUser, googleLoginUrl, verifyAuthToken } from "../../src/api/auth/auth.service";
import authPlugin from "../../src/api/auth/plugin";

describe("auth service", () => {
	beforeEach(() => {
		resetMockPrisma();
	});

	test("creates and verifies a JWT for a Google user", async () => {
		const { token, user } = await handleGoogleUser({ email: "user@example.com", name: "Test User" });

		expect(token.split(".")).toHaveLength(3);
		expect(verifyAuthToken(token)).toEqual({ userId: user.id });
	});

	test("rejects a modified JWT", async () => {
		const { token } = await handleGoogleUser({ email: "user@example.com" });
		const modifiedToken = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

		expect(verifyAuthToken(modifiedToken)).toBeNull();
	});

	test("builds the Google OAuth URL with the callback state", () => {
		const url = new URL(googleLoginUrl("oauth-state"));

		expect(url.origin).toBe("https://accounts.google.com");
		expect(url.searchParams.get("client_id")).toBe("google-client-id");
		expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:8080/api/auth/google/callback");
		expect(url.searchParams.get("state")).toBe("oauth-state");
		expect(url.searchParams.get("access_type")).toBe("offline");
	});

	test("accepts a Google refresh token without exposing it in the JWT", async () => {
		const { token } = await handleGoogleUser({
			email: "user@example.com",
			refreshToken: "google-refresh-token",
		});

		expect(token).not.toContain("google-refresh-token");
		expect(verifyAuthToken(token)).toEqual({ userId: 1 });
	});
});

describe("auth routes", () => {
	test("protects /me without a JWT cookie", async () => {
		const app = Fastify();
		app.register(authPlugin, { prefix: "/auth" });
		await app.ready();

		const response = await app.inject({ method: "GET", url: "/auth/me" });

		expect(response.statusCode).toBe(401);
		expect(JSON.parse(response.body)).toEqual({ error: "unauthorized" });
		await app.close();
	});

	test("returns the authenticated user from /me", async () => {
		const app = Fastify();
		app.register(authPlugin, { prefix: "/auth" });
		await app.ready();
		const { token } = await handleGoogleUser({ email: "user@example.com" });

		const response = await app.inject({
			method: "GET",
			url: "/auth/me",
			headers: { cookie: `auth_token=${token}` },
		});

		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body)).toEqual({ userId: 1 });
		await app.close();
	});

	test("clears the auth cookie on logout", async () => {
		const app = Fastify();
		app.register(authPlugin, { prefix: "/auth" });
		await app.ready();

		const response = await app.inject({ method: "POST", url: "/auth/logout" });

		expect(response.statusCode).toBe(204);
		const setCookie = response.headers["set-cookie"];
		const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
		expect(cookies).toContain("auth_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
		await app.close();
	});
});
