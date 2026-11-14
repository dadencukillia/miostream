import connector from "@utils/connector";
import { S3Connection } from "@/connections/s3";
import { PostgresConnection } from "@/connections/pg";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import Fastify, { type FastifyInstance } from "fastify";
import path from "node:path";
import userPlugin from "@/api/user/user.plugin";
import cdnPlugin from "@/cdn/cdn.plugin";
import { grantAuthMiddleware } from "@/api/auth/auth.middleware";

const avatarPicture = await Bun.file(path.join(import.meta.dir, "avatar.png")).bytes();

describe("user avatars", async () => {
	let fastify: FastifyInstance;
	let userId: string = "";
	let authUserId: string = "";

	beforeAll(async () => {
		fastify = Fastify({
			logger: true,
			pluginTimeout: 0,
			ajv: {
				customOptions: {
					unicodeRegExp: true,
					removeAdditional: false,
				}
			},
		});

		await fastify.register(connector, {
			retries: 3,
			interval: 15 * 1000,
			connections: [
				S3Connection,
				PostgresConnection,
			],
		});

		await fastify.register(userPlugin, { prefix: "/user" });
		await fastify.register(cdnPlugin, { prefix: "/cdn" });

		fastify.get("/_test_auth", { preHandler: grantAuthMiddleware() as any }, async (req) => ({
			userId: req.auth?.userId,
		}));
		const authResponse = await fastify.inject({
			path: "/_test_auth",
			method: "GET",
			headers: {
				authorization: "Bearer user"
			}
		});
		authUserId = authResponse.json<{ userId: string }>().userId;

		await fastify.pg.query("DELETE FROM public.users;");
	});

	afterAll(async () => {
		await fastify.pg.query("DELETE FROM public.users;");
		await fastify.close();
	});

	test("create user", async () => {
		const userData = {
			nickname: "tester",
			fullName: "Jack Jackson",
			email: "test@miostream.dev"
		};
		const response = await fastify.inject({
			path: "/user",
			method: "POST",
			payload: {
				...userData,
				password: "12345678"
			},
			headers: {
				"content-type": "application/json"
			}
		});
		const responsePayload = response.json<{ userId: string, nickname: string, fullName: string, email: string }>();

		await fastify.pg.query("UPDATE public.users SET user_id = $1 WHERE user_id = $2;", [authUserId, responsePayload.userId]);
		userId = authUserId;

		expect(responsePayload).toMatchObject({
			...userData,
			avatarId: null
		});
	});

	test("attach avatar to user", async () => {
		const response = await fastify.inject({
			path: "/user/avatar",
			method: "PUT",
			payload: JSON.stringify(avatarPicture.toBase64()),
			headers: {
				"content-type": "application/json",
				authorization: "Bearer user"
			}
		});

		const responsePayload = response.json<{ userId: string, avatarId: string }>();
		expect(responsePayload.userId).toBe(userId);
		expect(responsePayload.avatarId).toBeString();
		const firstAvatarId = responsePayload.avatarId;

		{
			const response = await fastify.inject({
				path: "/user/avatar",
				method: "PUT",
				payload: JSON.stringify(avatarPicture.toBase64()),
				headers: {
					"content-type": "application/json",
					authorization: "Bearer user"
				}
			});

			const responsePayload = response.json<{ userId: string, avatarId: string }>();
			expect(responsePayload.userId).toBe(userId);
			expect(responsePayload.avatarId).toBeString();
			expect(responsePayload.avatarId).not.toBe(firstAvatarId);
		}
	});

	test("reset user avatar", async () => {
		// Reset first, must be success

		{
			const response = await fastify.inject({
				path: "/user/avatar",
				method: "DELETE",
				headers: {
					authorization: "Bearer user"
				}
			});

			expect(response.statusCode).toEqual(204);
		}

		// Reset second time, must return error
		// something like "there already no avatar"

		{
			const response = await fastify.inject({
				path: "/user/avatar",
				method: "DELETE",
				headers: {
					authorization: "Bearer user"
				}
			});
			expect(response.statusCode).toEqual(409);
		}

		// Put a new avatar

		const response = await fastify.inject({
			path: "/user/avatar",
			method: "PUT",
			payload: JSON.stringify(avatarPicture.toBase64()),
			headers: {
				"content-type": "application/json",
				authorization: "Bearer user"
			}
		});
		const responsePayload = response.json<{ userId: string, avatarId: string }>();
		expect(responsePayload.userId).toBe(userId);
		expect(responsePayload.avatarId).toBeString();

		// Check CDN image availability

		const avatarId = responsePayload.avatarId;
		const avatarImageResponse = await fastify.inject({
			path: `/cdn/avatar/${avatarId}.webp`,
			method: "GET"
		});
		expect(avatarImageResponse.statusCode).toEqual(200);
		expect(avatarImageResponse.headers["content-type"]).toEqual("image/webp");

		// Reset and recheck availability

		{
			const response = await fastify.inject({
				path: "/user/avatar",
				method: "DELETE",
				headers: {
					authorization: "Bearer user"
				}
			});

			expect(response.statusCode).toEqual(204);

			const avatarImageResponse = await fastify.inject({
				path: `/cdn/avatar/${avatarId}.webp`,
				method: "GET"
			});
			expect(avatarImageResponse.statusCode).toEqual(404);
		}
	});
});
