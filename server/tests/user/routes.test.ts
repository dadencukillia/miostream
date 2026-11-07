import { afterEach, describe, expect, test } from "bun:test";
import Fastify from "fastify";
import userPlugin from "../../src/api/user/user.plugin";
import { hashPassword, verifyPassword } from "../../src/utils/password";

const id = "a7b3fd74-00ab-4d5c-949e-07c135475bd1";
const base = `/users/${id}`;
const now = "2026-01-01T00:00:00.000Z";
const userRow = [id, "alice", "Alice Doe", "alice@example.com", "", "", 0, "UTC", null, null, null, null, "user", "active", now, now];
const createBody = { nickname: "alice", fullName: "Alice Doe", email: "alice@example.com", googleId: "google-1" };

function setup(...results: (unknown[][] | Error)[]) {
    const calls: { text: string; values: unknown[] }[] = [];
    const app = Fastify();
    app.decorate("pg", {
        async query(config: { text: string; values: unknown[] }) {
            calls.push(config);
            const result = results.shift();
            if (result instanceof Error) throw result;
            return { rows: result ?? [] };
        },
    });
    app.register(userPlugin, { prefix: "/users" });
    apps.push(app);
    return { app, calls };
}

const apps: ReturnType<typeof Fastify>[] = [];
afterEach(async () => {
    await Promise.all(apps.splice(0).map(app => app.close()));
});

describe("user routes", () => {
    test("registers and returns a user without exposing authentication fields", async () => {
        const { app, calls } = setup([userRow]);
        const response = await app.inject({ method: "POST", url: "/users/", payload: createBody });
        expect(response.statusCode).toBe(201);
        expect(response.json()).toMatchObject({ userId: id, nickname: "alice", email: "alice@example.com", userRole: "user" });
        expect(response.json()).not.toHaveProperty("passwordHash");
        expect(response.json()).not.toHaveProperty("googleId");
        expect(calls[0]!.values.slice(3)).toEqual([null, "google-1", null]);
    });

    test.each([
        [{ ...createBody, googleId: undefined }, "Either password or googleId"],
        [{ ...createBody, timezone: "Mars/Olympus" }, "Invalid IANA timezone"],
        [{ ...createBody, nickname: "a" }, "nickname"],
        [{ ...createBody, email: "not-an-email" }, "email"],
        [{ ...createBody, password: "short" }, "password"],
    ])("rejects invalid registration before querying", async (payload, message) => {
        const { app, calls } = setup();
        const response = await app.inject({ method: "POST", url: "/users/", payload });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ ok: false, message: expect.stringContaining(message) });
        expect(calls).toHaveLength(0);
    });

    test("gets a user and returns 404 for a missing user", async () => {
        const { app, calls } = setup([userRow], []);
        const found = await app.inject({ method: "GET", url: base });
        expect(found.statusCode).toBe(200);
        expect(found.json()).toMatchObject({ userId: id, nickname: "alice" });
        const missing = await app.inject({ method: "GET", url: base });
        expect(missing.statusCode).toBe(404);
        expect(missing.json()).toEqual({ ok: false, message: `User with id '${id}' not found` });
        expect(calls[0]!.values).toEqual([id]);
    });

    test.each([
        ["PATCH", `${base}/profile`, { nickname: "alice", fullName: "Alice Doe", bio: "hello", timezone: "Mars/Olympus" }, "Invalid IANA timezone"],
        ["PATCH", `${base}/avatar`, { avatarUrl: "ftp://example.com/a" }, "Avatar URL"],
        ["PATCH", `${base}/customization`, {}, "At least one customization"],
        ["PATCH", `${base}/customization`, { profileFrameUrl: "ftp://example.com/a" }, "Profile frame URL"],
        ["PATCH", `${base}/customization`, { profileBackgroundUrl: "ftp://example.com/a" }, "Profile background URL"],
        ["PATCH", `${base}/password`, { oldPassword: "same-password", newPassword: "same-password" }, "New password must be different"],
        ["POST", `${base}/links`, { userLinkUrl: "ftp://example.com/a" }, "Link URL"],
        ["PUT", `${base}/links/1`, { userLinkUrl: "ftp://example.com/a" }, "Link URL"],
    ] as const)("rejects invalid %s %s", async (method, url, payload, message) => {
        const { app, calls } = setup();
        const response = await app.inject({ method, url, payload });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({ ok: false, message: expect.stringContaining(message) });
        expect(calls).toHaveLength(0);
    });

    test.each([
        ["GET", "/users/not-a-uuid", undefined],
        ["PATCH", `${base}/status`, { userStatus: "unknown" }],
        ["PATCH", `${base}/role`, { userRole: "owner" }],
        ["PUT", `${base}/links/0`, { userLinkUrl: "https://example.com" }],
        ["DELETE", `${base}/links/9007199254740992`, undefined],
    ] as const)("validates parameters and enum values on %s %s", async (method, url, payload) => {
        const { app, calls } = setup();
        const response = await app.inject({ method, url, payload });
        expect(response.statusCode).toBe(400);
        expect(response.json().ok).toBe(false);
        expect(calls).toHaveLength(0);
    });

    test.each([
        ["profile", { nickname: "alice", fullName: "Alice Doe", bio: "Hello", timezone: "UTC" }, ["alice", "Alice Doe", "Hello", "UTC", id]],
        ["avatar", { avatarUrl: "https://example.com/avatar" }, ["https://example.com/avatar", id]],
        ["status", { userStatus: "banned" }, ["banned", id]],
        ["role", { userRole: "admin" }, ["admin", id]],
    ])("updates user %s", async (path, payload, values) => {
        const { app, calls } = setup([userRow]);
        const response = await app.inject({ method: "PATCH", url: `${base}/${path}`, payload });
        expect(response.statusCode).toBe(200);
        expect(response.json().userId).toBe(id);
        expect(calls[0]!.values).toEqual(values);
    });

    test("changes password and deletes a user with empty 204 responses", async () => {
        const oldHash = await hashPassword("old-password");
        const { app, calls } = setup([[oldHash]], [[id]], [[id]]);
        const changed = await app.inject({ method: "PATCH", url: `${base}/password`, payload: { oldPassword: "old-password", newPassword: "new-password" } });
        expect(changed.statusCode).toBe(204);
        expect(changed.body).toBe("");
        expect(await verifyPassword("new-password", calls[1]!.values[0] as string)).toBe(true);
        const deleted = await app.inject({ method: "DELETE", url: base });
        expect(deleted.statusCode).toBe(204);
        expect(deleted.body).toBe("");
        expect(calls[2]!.values).toEqual([id]);
    });

    test("returns 404 when a link is absent for the requested user", async () => {
        const { app, calls } = setup([], []);
        const updated = await app.inject({ method: "PUT", url: `${base}/links/7`, payload: { userLinkUrl: "https://example.com" } });
        const deleted = await app.inject({ method: "DELETE", url: `${base}/links/7` });
        expect(updated.statusCode).toBe(404);
        expect(deleted.statusCode).toBe(404);
        expect(updated.json()).toEqual({ ok: false, message: "User link with id '7' not found" });
        expect(calls.map(call => call.values.slice(-2))).toEqual([["7", id], ["7", id]]);
    });

    test("accepts null customization to clear a field", async () => {
        const { app, calls } = setup([userRow]);
        const response = await app.inject({ method: "PATCH", url: `${base}/customization`, payload: { profileFrameUrl: null } });
        expect(response.statusCode).toBe(200);
        expect(calls[0]!.values).toEqual([true, null, false, null, id]);
    });

    test("creates, lists, updates and deletes links", async () => {
        const row = ["7", id, "https://example.com"];
        const { app, calls } = setup([row], [row], [row], [["7"]]);
        const payload = { userLinkUrl: "https://example.com" };
        const created = await app.inject({ method: "POST", url: `${base}/links`, payload });
        expect(created.statusCode).toBe(201);
        expect(created.json()).toEqual({ userLinkId: 7, userId: id, ...payload });
        const listed = await app.inject({ method: "GET", url: `${base}/links` });
        expect(listed.statusCode).toBe(200);
        expect(listed.json()).toEqual([created.json()]);
        const updated = await app.inject({ method: "PUT", url: `${base}/links/7`, payload });
        expect(updated.statusCode).toBe(200);
        expect(updated.json()).toEqual(created.json());
        const deleted = await app.inject({ method: "DELETE", url: `${base}/links/7` });
        expect(deleted.statusCode).toBe(204);
        expect(deleted.body).toBe("");
        expect(calls[2]!.values).toEqual([payload.userLinkUrl, "7", id]);
        expect(calls[3]!.values).toEqual(["7", id]);
    });

    test("maps duplicate links and hides unexpected database details", async () => {
        const duplicate = Object.assign(new Error("duplicate"), { code: "23505", constraint: "user_links_user_id_user_link_url_key" });
        const { app } = setup(duplicate, new Error("internal secret"));
        const payload = { userLinkUrl: "https://example.com" };
        const conflict = await app.inject({ method: "POST", url: `${base}/links`, payload });
        expect(conflict.statusCode).toBe(409);
        expect(conflict.json()).toEqual({ ok: false, message: "This link already exists in user profile" });
        const failure = await app.inject({ method: "GET", url: base });
        expect(failure.statusCode).toBe(500);
        expect(failure.json()).toEqual({ ok: false, message: "Database operation failed" });
    });
});
