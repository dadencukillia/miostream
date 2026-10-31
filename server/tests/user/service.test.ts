import { describe, expect, test } from "bun:test";
import type { Pool } from "pg";
import * as service from "../../src/api/user/user.service";
import { UserAlreadyExistsError, UserError, UserInvalidError, UserNotFoundError } from "../../src/api/user/user.errors";
import { hashPassword, verifyPassword } from "../../src/utils/password";
import { isValidTimezone } from "../../src/utils/timezones";
import { isSafeHttpUrl } from "../../src/utils/urls";

const id = "a7b3fd74-00ab-4d5c-949e-07c135475bd1";
const now = new Date("2026-01-01T00:00:00Z");
const userRow = [id, "alice", "Alice Doe", "alice@example.com", "", "", 0, "UTC", null, null, null, null, "user", "active", now, now];
const user = { userId: id, nickname: "alice", fullName: "Alice Doe", email: "alice@example.com", bio: "", avatarUrl: "", maxStreak: 0, timezone: "UTC", streakStartDate: null, lastWatchDate: null, profileFrameUrl: null, profileBackgroundUrl: null, userRole: "user", userStatus: "active", createdAt: now, updatedAt: now };

function database(...results: (unknown[][] | Error)[]) {
    const calls: { text: string; values: unknown[] }[] = [];
    const pool = {
        async query(config: { text: string; values: unknown[] }) {
            calls.push(config);
            const result = results.shift();
            if (result instanceof Error) throw result;
            return { rows: result ?? [] };
        },
    } as unknown as Pool;
    return { pool, calls };
}

describe("user service", () => {
    test("creates password and OAuth users without storing plaintext passwords", async () => {
        const db = database([userRow], [userRow]);
        const details = { nickname: "alice", fullName: "Alice Doe", email: "alice@example.com" };
        expect(await service.createUser(db.pool, { ...details, password: "old-password" })).toEqual(user);
        const [nickname, name, email, hash, googleId, timezone] = db.calls[0]!.values;
        expect([nickname, name, email, googleId, timezone]).toEqual(["alice", "Alice Doe", "alice@example.com", null, null]);
        expect(hash).not.toBe("old-password");
        expect(await verifyPassword("old-password", hash as string)).toBe(true);
        expect(await service.createUser(db.pool, { ...details, googleId: "google-1", timezone: "UTC" })).toEqual(user);
        expect(db.calls[1]!.values.slice(3)).toEqual([null, "google-1", "UTC"]);
    });

    test.each([
        ["id", (pool: Pool) => service.getUserById(pool, id), id],
        ["email", (pool: Pool) => service.getUserByEmail(pool, "alice@example.com"), "alice@example.com"],
        ["Google ID", (pool: Pool) => service.getUserByGoogleId(pool, "google-1"), "google-1"],
    ])("looks up by %s and rejects missing users", async (_label, lookup, value) => {
        const db = database([userRow], []);
        expect(await lookup(db.pool)).toEqual(user);
        expect(db.calls[0]!.values).toEqual([value]);
        await expect(lookup(db.pool)).rejects.toBeInstanceOf(UserNotFoundError);
    });

    test("updates profile, avatar, status, role and deletes a user", async () => {
        const db = database([userRow], [userRow], [userRow], [userRow], [[id]], []);
        const profile = { nickname: "alice", fullName: "Alice Doe", bio: "Hello", timezone: "UTC" };
        expect(await service.updateUserProfile(db.pool, id, profile)).toEqual(user);
        expect(db.calls[0]!.values).toEqual([profile.nickname, profile.fullName, profile.bio, profile.timezone, id]);
        expect(await service.updateUserAvatar(db.pool, id, "https://example.com/avatar")).toEqual(user);
        expect(await service.updateUserStatus(db.pool, id, "banned")).toEqual(user);
        expect(await service.updateUserRole(db.pool, id, "admin")).toEqual(user);
        expect(db.calls.slice(1, 4).map(call => call.values)).toEqual([
            ["https://example.com/avatar", id], ["banned", id], ["admin", id],
        ]);
        await expect(service.deleteUserById(db.pool, id)).resolves.toBeUndefined();
        await expect(service.deleteUserById(db.pool, id)).rejects.toBeInstanceOf(UserNotFoundError);
    });

    test.each([
        ["profile", (pool: Pool) => service.updateUserProfile(pool, id, { nickname: "alice", fullName: "Alice Doe", bio: "", timezone: "UTC" })],
        ["avatar", (pool: Pool) => service.updateUserAvatar(pool, id, "https://example.com")],
        ["customization", (pool: Pool) => service.updateUserCustomization(pool, id, { profileFrameUrl: null })],
        ["status", (pool: Pool) => service.updateUserStatus(pool, id, "active")],
        ["role", (pool: Pool) => service.updateUserRole(pool, id, "user")],
    ])("reports a missing user when updating %s", async (_label, update) => {
        await expect(update(database([]).pool)).rejects.toBeInstanceOf(UserNotFoundError);
    });

    test("distinguishes omitted customization fields from explicit nulls", async () => {
        const db = database([userRow], [userRow], [userRow]);
        await service.updateUserCustomization(db.pool, id, { profileFrameUrl: null });
        await service.updateUserCustomization(db.pool, id, { profileBackgroundUrl: "https://example.com/bg" });
        await service.updateUserCustomization(db.pool, id, { profileFrameUrl: "https://example.com/frame", profileBackgroundUrl: null });
        expect(db.calls.map(call => call.values)).toEqual([
            [true, null, false, null, id],
            [false, null, true, "https://example.com/bg", id],
            [true, "https://example.com/frame", true, null, id],
        ]);
    });

    test("changes a password only after verifying the old one", async () => {
        const oldHash = await hashPassword("old-password");
        const db = database([[oldHash]], [[id]]);
        await expect(service.updateUserPassword(db.pool, id, { oldPassword: "old-password", newPassword: "new-password" })).resolves.toBeUndefined();
        expect(db.calls[1]!.values[1]).toBe(id);
        expect(await verifyPassword("new-password", db.calls[1]!.values[0] as string)).toBe(true);
        expect(await verifyPassword("old-password", db.calls[1]!.values[0] as string)).toBe(false);

        for (const [rows, expected] of [[[], UserNotFoundError], [[[null]], UserInvalidError], [[[oldHash]], UserInvalidError]] as const) {
            const failing = database(rows as unknown[][]);
            await expect(service.updateUserPassword(failing.pool, id, { oldPassword: "wrong-password", newPassword: "new-password" })).rejects.toBeInstanceOf(expected);
            expect(failing.calls).toHaveLength(1);
        }
        const disappeared = database([[oldHash]], []);
        await expect(service.updateUserPassword(disappeared.pool, id, { oldPassword: "old-password", newPassword: "new-password" })).rejects.toBeInstanceOf(UserNotFoundError);
    });

    test("creates, lists, updates and deletes user links scoped to the user", async () => {
        const linkRow = ["7", id, "https://example.com"];
        const link = { userLinkId: "7", userId: id, userLinkUrl: "https://example.com" };
        const db = database([linkRow], [linkRow], [linkRow], [["7"]], [], []);
        expect(await service.createUserLink(db.pool, id, link.userLinkUrl)).toEqual(link);
        expect(await service.listUserLinksByUserId(db.pool, id)).toEqual([link]);
        expect(await service.updateUserLink(db.pool, id, 7, link.userLinkUrl)).toEqual(link);
        await expect(service.deleteUserLinkById(db.pool, id, 7n)).resolves.toBeUndefined();
        expect(db.calls.map(call => call.values)).toEqual([
            [id, link.userLinkUrl], [id], [link.userLinkUrl, "7", id], ["7", id],
        ]);
        await expect(service.updateUserLink(db.pool, id, 7, link.userLinkUrl)).rejects.toBeInstanceOf(UserNotFoundError);
        await expect(service.deleteUserLinkById(db.pool, id, 7)).rejects.toBeInstanceOf(UserNotFoundError);
        expect(await service.listUserLinksByUserId(database([]).pool, id)).toEqual([]);
    });

    test.each([
        ["23505", "idx_users_unique_lower_nickname", UserAlreadyExistsError, "User with this nickname already exists"],
        ["23505", "idx_users_unique_lower_email", UserAlreadyExistsError, "User with this email already exists"],
        ["23505", "users_google_id_key", UserAlreadyExistsError, "This Google account is already linked to another user"],
        ["23505", "user_links_user_id_user_link_url_key", UserAlreadyExistsError, "This link already exists in user profile"],
        ["23505", "other", UserAlreadyExistsError, "Record with these unique attributes already exists"],
        ["23503", "user_links_user_id_fkey", UserNotFoundError, "Referenced user does not exist"],
        ["23503", "other", UserInvalidError, "Referenced resource does not exist"],
        ["23514", "", UserInvalidError, "Data does not satisfy database constraints"],
        ["22P02", "", UserInvalidError, "Invalid identifier format"],
        ["22003", "", UserInvalidError, "Numeric value is out of range"],
        ["22001", "", UserInvalidError, "Value is too long"],
    ])("maps database error %s (%s)", async (code, constraint, errorType, message) => {
        const db = database(Object.assign(new Error("database detail"), { code, constraint }));
        const result = service.createUserLink(db.pool, id, "https://example.com");
        await expect(result).rejects.toBeInstanceOf(errorType);
        await expect(result).rejects.toThrow(message);
    });

    test("hides unexpected database details while preserving the cause", async () => {
        const cause = new Error("sensitive database detail");
        try {
            await service.getUserById(database(cause).pool, id);
            throw new Error("expected rejection");
        } catch (error) {
            expect(error).toBeInstanceOf(UserError);
            expect((error as Error).message).toBe("Database operation failed");
            expect((error as Error).cause).toBe(cause);
        }
        await expect(service.createUserLink(database([]).pool, id, "https://example.com")).rejects.toThrow("Failed to create user link");
        await expect(service.createUser(database([]).pool, { nickname: "alice", fullName: "Alice Doe", email: "alice@example.com", googleId: "g" })).rejects.toThrow("Failed to create user record");
    });
});

describe("user utilities", () => {
    test.each([["https://example.com/path", true], ["http://localhost:8080", true], ["ftp://example.com", false], ["javascript:alert(1)", false], ["/relative", false], ["", false]])("checks URL %s", (url, expected) => {
        expect(isSafeHttpUrl(url)).toBe(expected);
    });
    test.each([["UTC", true], ["Europe/Kyiv", true], ["Mars/Olympus", false], ["", false]])("checks timezone %s", (zone, expected) => {
        expect(isValidTimezone(zone)).toBe(expected);
    });
});
