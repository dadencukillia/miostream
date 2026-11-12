import connector from "@utils/connector";
import { PostgresConnection } from "@/connections/pg";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import Fastify, { type FastifyInstance } from "fastify";
import * as service from "@/api/user/services/user.service";

describe("user service", () => {
	let fastify: FastifyInstance;
	let userId: string = "";
	let linkId: string = "";

	beforeAll(async () => {
		fastify = Fastify({ logger: false, pluginTimeout: 0 });

		await fastify.register(connector, {
			retries: 3,
			interval: 15 * 1000,
			connections: [PostgresConnection],
		});

		await fastify.pg.query("DELETE FROM public.users;");
	});

	afterAll(async () => {
		await fastify.pg.query("DELETE FROM public.users;");
		await fastify.close();
	});

	test("create user", async () => {
		const user = await service.createUser(fastify.pg, {
			nickname: "tester_service",
			fullName: "Service Tester",
			email: "service_test@miostream.dev",
			password: "password123",
			timezone: "Europe/Kyiv",
		});

		userId = user.userId;

		expect(user).toMatchObject({
			nickname: "tester_service",
			fullName: "Service Tester",
			email: "service_test@miostream.dev",
			userRole: "user",
			userStatus: "active",
			avatarId: null,
			timezone: "Europe/Kyiv",
		});
	});

	test("get user by id and email", async () => {
		const byId = await service.getUserById(fastify.pg, userId);
		expect(byId).toMatchObject({
			userId,
			nickname: "tester_service",
			email: "service_test@miostream.dev",
		});

		const byEmail = await service.getUserByEmail(fastify.pg, "SERVICE_TEST@MIOSTREAM.DEV");
		expect(byEmail.userId).toBe(userId);
	});

	test("update profile and customization", async () => {
		const updatedProfile = await service.updateUserProfile(fastify.pg, userId, {
			nickname: "tester_pro",
			fullName: "Service Pro",
			bio: "Anime fan",
			timezone: "UTC",
		});

		expect(updatedProfile).toMatchObject({
			userId,
			nickname: "tester_pro",
			fullName: "Service Pro",
			bio: "Anime fan",
			timezone: "UTC",
		});

		const updatedCustom = await service.updateUserCustomization(fastify.pg, userId, {
			profileFrameUrl: "https://example.com/frame.webp",
			profileBackgroundUrl: null,
		});

		expect(updatedCustom).toMatchObject({
			profileFrameUrl: "https://example.com/frame.webp",
			profileBackgroundUrl: null,
		});
	});

	test("update password", async () => {
		await service.updateUserPassword(fastify.pg, userId, {
			oldPassword: "password123",
			newPassword: "newPassword456",
		});

		expect(
			service.updateUserPassword(fastify.pg, userId, {
				oldPassword: "wrongPassword",
				newPassword: "brandNewPassword",
			})
		).rejects.toThrow();
	});

	test("update status and role", async () => {
		const updatedStatus = await service.updateUserStatus(fastify.pg, userId, "banned");
		expect(updatedStatus.userStatus).toBe("banned");

		const updatedRole = await service.updateUserRole(fastify.pg, userId, "admin");
		expect(updatedRole.userRole).toBe("admin");
	});

	test("user links lifecycle", async () => {
		const link = await service.createUserLink(
			fastify.pg,
			userId,
			"https://github.com/miostream"
		);
		linkId = link.userLinkId;
		expect(link.userLinkUrl).toBe("https://github.com/miostream");

		const links = await service.listUserLinksByUserId(fastify.pg, userId);
		expect(links.length).toBe(1);
		expect(links[0]?.userLinkUrl).toBe("https://github.com/miostream");

		const updated = await service.updateUserLink(
			fastify.pg,
			userId,
			linkId,
			"https://gitlab.com/miostream"
		);
		expect(updated.userLinkUrl).toBe("https://gitlab.com/miostream");

		await service.deleteUserLinkById(fastify.pg, userId, linkId);
		const emptyLinks = await service.listUserLinksByUserId(fastify.pg, userId);
		expect(emptyLinks.length).toBe(0);
	});

	test("delete user", async () => {
		await service.deleteUserById(fastify.pg, userId);

		expect(service.getUserById(fastify.pg, userId)).rejects.toThrow();
	});
});
