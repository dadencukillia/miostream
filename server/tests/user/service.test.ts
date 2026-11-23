import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as service from "@/api/user/services/user.service";
import { getDatabasePool } from "../dbHelper";
import { wipeOAuthUsers } from "../oauthHelper";

describe("user service", () => {
	const db = getDatabasePool();
	let userId: string = "";
	let linkId: string = "";

	beforeAll(async () => {
		await wipeOAuthUsers();
	});

	afterAll(async () => {
		await wipeOAuthUsers();
	});

	test("create user", async () => {
		const user = await service.createUser(db, {
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
			avatarUrl: null,
			timezone: "Europe/Kyiv",
		});
	});

	test("get user by id and email", async () => {
		const byId = await service.getUserById(db, userId);
		expect(byId).toMatchObject({
			userId,
			nickname: "tester_service",
			email: "service_test@miostream.dev",
		});

		const byEmail = await service.getUserByEmail(db, "SERVICE_TEST@MIOSTREAM.DEV");
		expect(byEmail.userId).toBe(userId);
	});

	test("update profile and customization", async () => {
		const updatedProfile = await service.updateUserProfile(db, userId, {
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

		const updatedCustom = await service.updateUserCustomization(db, userId, {
			profileFrameUrl: "https://example.com/frame.webp",
			profileBackgroundUrl: null,
		});

		expect(updatedCustom).toMatchObject({
			profileFrameUrl: "https://example.com/frame.webp",
			profileBackgroundUrl: null,
		});
	});

	test("update password", async () => {
		await service.updateUserPassword(db, userId, {
			oldPassword: "password123",
			newPassword: "newPassword456",
		});

		expect(
			service.updateUserPassword(db, userId, {
				oldPassword: "wrongPassword",
				newPassword: "brandNewPassword",
			})
		).rejects.toThrow();
	});

	test("update status and role", async () => {
		const updatedStatus = await service.updateUserStatus(db, userId, "banned");
		expect(updatedStatus.userStatus).toBe("banned");

		const updatedRole = await service.updateUserRole(db, userId, "admin");
		expect(updatedRole.userRole).toBe("admin");
	});

	test("user links lifecycle", async () => {
		const link = await service.createUserLink(
			db,
			userId,
			"https://github.com/miostream"
		);
		linkId = link.userLinkId;
		expect(link.userLinkUrl).toBe("https://github.com/miostream");

		const links = await service.listUserLinksByUserId(db, userId);
		expect(links.length).toBe(1);
		expect(links[0]?.userLinkUrl).toBe("https://github.com/miostream");

		const updated = await service.updateUserLink(
			db,
			userId,
			linkId,
			"https://gitlab.com/miostream"
		);
		expect(updated.userLinkUrl).toBe("https://gitlab.com/miostream");

		await service.deleteUserLinkById(db, userId, linkId);
		const emptyLinks = await service.listUserLinksByUserId(db, userId);
		expect(emptyLinks.length).toBe(0);
	});

	test("delete user", async () => {
		await service.deleteUserById(db, userId);

		expect(service.getUserById(db, userId)).rejects.toThrow();
	});
});
