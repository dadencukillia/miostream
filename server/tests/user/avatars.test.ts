import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { type FastifyInstance } from "fastify";
import path from "node:path";
import { fastifyInstance } from "../fastifyHelper";
import { newTestAuth, wipeOAuthUsers } from "../oauthHelper";

const avatarPicture = await Bun.file(path.join(import.meta.dir, "avatar.png")).bytes();

describe("user avatars", async () => {
	let fastify: FastifyInstance;
	let userId: string = "";
	let authorization: string = "Bearer";

	beforeAll(async () => {
		fastify = await fastifyInstance();
		await wipeOAuthUsers();

		let user;
		({ authorization, user } = await newTestAuth("user", "active"));
		userId = user.userId;
	});

	afterAll(async () => {
		await wipeOAuthUsers();
		await fastify.close();
	});

	test("attach avatar to user", async () => {
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
