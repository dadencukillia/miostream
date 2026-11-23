import { afterAll, describe, expect, test } from "bun:test";
import path from "node:path";
import { fastifyInstance } from "../fastifyHelper";
import { newTestAuth, wipeOAuthUsers } from "../oauthHelper";
import { beforeAllReturning } from "../testHelper";

const avatarPicture = await Bun.file(path.join(import.meta.dir, "avatar.png")).bytes();

describe("user avatars", () => {
	const beforeValues = beforeAllReturning(async () => {
		const fastify = await fastifyInstance();
		await wipeOAuthUsers();
		const { authorization, user } = await newTestAuth("user", "active");
		return { fastify, authorization, userId: user.userId };
	});

	afterAll(async () => {
		const { fastify } = await beforeValues;
		await wipeOAuthUsers();
		await fastify.close();
	});

	test("attach avatar to user", async () => {
		const { fastify, authorization, userId } = await beforeValues;

		const response = await fastify.inject({
			path: "/api/user/avatar",
			method: "PUT",
			payload: JSON.stringify(avatarPicture.toBase64()),
			headers: {
				"content-type": "application/json",
				authorization
			}
		});

		const responsePayload = response.json<{ userId: string, avatarUrl: string }>();
		expect(responsePayload.userId).toBe(userId);
		expect(responsePayload.avatarUrl).toMatch(/^\/cdn\/avatar\/[0-9a-f-]+\.webp$/);
		const firstAvatarUrl = responsePayload.avatarUrl;

		{
			const response = await fastify.inject({
				path: "/api/user/avatar",
				method: "PUT",
				payload: JSON.stringify(avatarPicture.toBase64()),
				headers: {
					"content-type": "application/json",
					authorization
				}
			});

			const responsePayload = response.json<{ userId: string, avatarUrl: string }>();
			expect(responsePayload.userId).toBe(userId);
			expect(responsePayload.avatarUrl).toMatch(/^\/cdn\/avatar\/[0-9a-f-]+\.webp$/);
			expect(responsePayload.avatarUrl).not.toBe(firstAvatarUrl);
		}
	});

	test("reset user avatar", async () => {
		const { fastify, authorization, userId } = await beforeValues;

		// Reset first, must be success
		{
			const response = await fastify.inject({
				path: "/api/user/avatar",
				method: "DELETE",
				headers: {
					authorization
				}
			});

			expect(response.statusCode).toEqual(204);
		}

		// Reset second time, must return error
		{
			const response = await fastify.inject({
				path: "/api/user/avatar",
				method: "DELETE",
				headers: {
					authorization
				}
			});
			expect(response.statusCode).toEqual(409);
		}

		// Put a new avatar
		const response = await fastify.inject({
			path: "/api/user/avatar",
			method: "PUT",
			payload: JSON.stringify(avatarPicture.toBase64()),
			headers: {
				"content-type": "application/json",
				authorization
			}
		});
		const responsePayload = response.json<{ userId: string, avatarUrl: string }>();
		expect(responsePayload.userId).toBe(userId);
		expect(responsePayload.avatarUrl).toMatch(/^\/cdn\/avatar\/[0-9a-f-]+\.webp$/);

		// Check CDN image availability
		const avatarUrl = responsePayload.avatarUrl;
		const avatarImageResponse = await fastify.inject({
			path: avatarUrl,
			method: "GET"
		});
		expect(avatarImageResponse.statusCode).toEqual(200);
		expect(avatarImageResponse.headers["content-type"]).toEqual("image/webp");

		// Reset and recheck availability
		{
			const response = await fastify.inject({
				path: "/api/user/avatar",
				method: "DELETE",
				headers: {
					authorization
				}
			});

			expect(response.statusCode).toEqual(204);

			const avatarImageResponse = await fastify.inject({
				path: avatarUrl,
				method: "GET"
			});
			expect(avatarImageResponse.statusCode).toEqual(404);
		}
	});
});
