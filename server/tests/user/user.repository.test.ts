import { describe, it, expect, beforeEach, afterEach, afterAll } from "bun:test";
import { randomUUID } from "node:crypto";
import prisma, { pool } from "../../src/db";
import { UserRepository } from "../../src/api/user/user.repository";
import { UserAlreadyExistsError } from "../../src/api/user/user.errors";

describe("UserRepository (Integration — requires a reachable Postgres configured via POSTGRES_HOST / DB_*)", () => {
  const repo = new UserRepository(prisma);

  const createdUserIdsPendingCleanup: string[] = [];

  const uniquePayload = (overrides: Record<string, unknown> = {}) => {
    const suffix = randomUUID().slice(0, 8);
    return {
      nickname: `test_user_${suffix}`,
      name: "Test User",
      email: `test_${suffix}@example.com`,
      password_hash: "hash",
      ...overrides,
    };
  };

  afterEach(async () => {
    while (createdUserIdsPendingCleanup.length) {
      const id = createdUserIdsPendingCleanup.pop()!;
      await repo.delete(id).catch(() => {});
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  describe("create", () => {
    it("creates a user and returns it with defaults applied", async () => {
      const payload = uniquePayload();

      const user = await repo.create(payload);
      createdUserIdsPendingCleanup.push(user.id);

      expect(user.id).toBeTruthy();
      expect(user.nickname).toBe(payload.nickname);
      expect(user.email).toBe(payload.email);
      expect(user.current_streak).toBe(0);
      expect(user.max_streak).toBe(0);
      expect(user.timezone).toBe("UTC");
      expect(user.profile_frame).toBe("DEFAULT");
      expect(user.profile_background).toBe("DEFAULT");
      expect(user.bio).toBeNull();
      expect(user.avatar_url).toBeNull();
      expect(user.social_networks).toEqual([]);
    });

    it("respects explicitly provided optional fields", async () => {
      const payload = uniquePayload({
        bio: "hello world",
        timezone: "Europe/Kyiv",
        social_networks: ["https://example.com/me"],
      });

      const user = await repo.create(payload);
      createdUserIdsPendingCleanup.push(user.id);

      expect(user.bio).toBe("hello world");
      expect(user.timezone).toBe("Europe/Kyiv");
      expect(user.social_networks).toEqual(["https://example.com/me"]);
    });

    it("throws UserAlreadyExistsError on duplicate nickname", async () => {
      const payload = uniquePayload();
      const first = await repo.create(payload);
      createdUserIdsPendingCleanup.push(first.id);

      const duplicateNickname = uniquePayload({
        nickname: payload.nickname, // same nickname, different email
      });

      await expect(repo.create(duplicateNickname)).rejects.toThrow(
        UserAlreadyExistsError
      );
    });

    it("throws UserAlreadyExistsError on duplicate email", async () => {
      const payload = uniquePayload();
      const first = await repo.create(payload);
      createdUserIdsPendingCleanup.push(first.id);

      const duplicateEmail = uniquePayload({
        email: payload.email, // same email, different nickname
      });

      await expect(repo.create(duplicateEmail)).rejects.toThrow(
        UserAlreadyExistsError
      );
    });
  });

  describe("getById", () => {
    it("returns the user for an existing id", async () => {
      const created = await repo.create(uniquePayload());
      createdUserIdsPendingCleanup.push(created.id);

      const found = await repo.getById(created.id);

      expect(found?.id).toBe(created.id);
    });

    it("returns null for a well-formed but non-existent id", async () => {
      const found = await repo.getById("00000000-0000-0000-0000-000000000000");

      expect(found).toBeNull();
    });
  });

  describe("getByEmail", () => {
    it("returns the user for a matching email", async () => {
      const created = await repo.create(uniquePayload());
      createdUserIdsPendingCleanup.push(created.id);

      const found = await repo.getByEmail(created.email);

      expect(found?.id).toBe(created.id);
    });

    it("returns null when no user has that email", async () => {
      const found = await repo.getByEmail("nobody-has-this@example.com");

      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    it("updates only the provided fields, leaving the rest untouched", async () => {
      const created = await repo.create(
        uniquePayload({ bio: "original bio", timezone: "UTC" })
      );
      createdUserIdsPendingCleanup.push(created.id);

      const updated = await repo.update(created.id, { name: "Updated Name" });

      expect(updated?.name).toBe("Updated Name");
      expect(updated?.bio).toBe("original bio"); // unchanged
      expect(updated?.timezone).toBe("UTC"); // unchanged
      expect(updated?.nickname).toBe(created.nickname); // unchanged
    });

    it("leaves a nullable field untouched when it is omitted from the update", async () => {
      const created = await repo.create(uniquePayload({ bio: "will be kept" }));
      createdUserIdsPendingCleanup.push(created.id);

      const updated = await repo.update(created.id, { bio: undefined as any });

      expect(updated?.bio).toBe("will be kept");
    });

    it("clears a nullable field when it is explicitly set to null", async () => {
      const created = await repo.create(uniquePayload({ bio: "will be cleared" }));
      createdUserIdsPendingCleanup.push(created.id);

      const cleared = await repo.update(created.id, { bio: null as any });

      expect(cleared?.bio).toBeNull();
    });

    it("bumps updated_at on every update", async () => {
      const created = await repo.create(uniquePayload());
      createdUserIdsPendingCleanup.push(created.id);

      await new Promise((r) => setTimeout(r, 10));
      const updated = await repo.update(created.id, { name: "Touch" });

      expect(new Date(updated!.updated_at).getTime()).toBeGreaterThan(
        new Date(created.updated_at).getTime()
      );
    });

    it("returns null when updating a non-existent id", async () => {
      const result = await repo.update(
        "00000000-0000-0000-0000-000000000000",
        { name: "Ghost" }
      );

      expect(result).toBeNull();
    });

    it("throws UserAlreadyExistsError when the new email collides with another user", async () => {
      const userA = await repo.create(uniquePayload());
      createdUserIdsPendingCleanup.push(userA.id);
      const userB = await repo.create(uniquePayload());
      createdUserIdsPendingCleanup.push(userB.id);

      await expect(
        repo.update(userB.id, { email: userA.email })
      ).rejects.toThrow(UserAlreadyExistsError);
    });
  });

  describe("delete", () => {
    it("deletes an existing user and returns true", async () => {
      const created = await repo.create(uniquePayload());

      const result = await repo.delete(created.id);

      expect(result).toBe(true);
      expect(await repo.getById(created.id)).toBeNull();
    });

    it("returns false when the id does not exist", async () => {
      const result = await repo.delete("00000000-0000-0000-0000-000000000000");

      expect(result).toBe(false);
    });
  });
});
