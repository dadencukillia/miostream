import { describe, it, expect, afterEach, afterAll } from "bun:test";
import { randomUUID } from "node:crypto";
import prisma, { pool } from "../../src/db";
import type { UserModel } from "@prisma/generated/models/User";
import * as userRepo from "../../src/api/user/repository";
import type { CreateUserRepoInput } from "../../src/api/user/dto";

function assertDefined<T>(
    val: T,
    message = "Expected value to be defined"
): asserts val is NonNullable<T> {
    if (val === undefined || val === null) {
        throw new Error(message);
    }
}

type TestUserPayload = CreateUserRepoInput & {
    nickname: string;
    name: string;
    email: string;
    password_hash: string;
};

describe("UserRepository (Integration — requires a reachable Postgres configured via POSTGRES_HOST / DB_*)", () => {
    const createdUserIdsPendingCleanup: string[] = [];

    const uniquePayload = (
        overrides: Partial<CreateUserRepoInput> = {}
    ): TestUserPayload => {
        const suffix = randomUUID().slice(0, 8);
        return {
            nickname: `test_user_${suffix}`,
            name: "Test User",
            email: `test_${suffix}@example.com`,
            password_hash: "hash",
            ...overrides,
        };
    };

    const createTestUser = async (
        overrides: Partial<CreateUserRepoInput> = {}
    ): Promise<UserModel> => {
        const payload = uniquePayload(overrides);
        const [user] = await userRepo.createUser(payload);
        assertDefined(user);
        createdUserIdsPendingCleanup.push(user.id);
        return {
            ...user,
            social_networks: user.social_networks ?? [],
        } as UserModel;
    };

    afterEach(async () => {
        while (createdUserIdsPendingCleanup.length) {
            const id = createdUserIdsPendingCleanup.pop()!;
            await userRepo.deleteUser(id).catch(() => { });
        }
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

    describe("createUser", () => {
        it("creates a user and returns it with defaults applied", async () => {
            const payload = uniquePayload();

            const [user] = await userRepo.createUser(payload);
            assertDefined(user);
            createdUserIdsPendingCleanup.push(user.id);

            expect(user.id).toBeTruthy();
            expect(user.nickname).toBe(payload.nickname);
            expect(user.email).toBe(payload.email);
            expect(user.max_streak).toBe(0);
            expect(user.timezone).toBe("UTC");
            expect(user.profile_frame).toBe("DEFAULT");
            expect(user.profile_background).toBe("DEFAULT");
            expect(user.bio).toBeNull();
            expect(user.avatar_url).toBeNull();
            expect(user.social_networks ?? []).toEqual([]);
        });

        it("throws on duplicate nickname", async () => {
            const payload = uniquePayload();
            const [first] = await userRepo.createUser(payload);
            assertDefined(first);
            createdUserIdsPendingCleanup.push(first.id);

            const duplicateNickname = uniquePayload({
                nickname: payload.nickname,
            });

            await expect(userRepo.createUser(duplicateNickname)).rejects.toThrow();
        });

        it("throws on duplicate email", async () => {
            const payload = uniquePayload();
            const [first] = await userRepo.createUser(payload);
            assertDefined(first);
            createdUserIdsPendingCleanup.push(first.id);

            const duplicateEmail = uniquePayload({
                email: payload.email,
            });

            await expect(userRepo.createUser(duplicateEmail)).rejects.toThrow();
        });
    });

    describe("getUserById", () => {
        it("returns the user for an existing id", async () => {
            const created = await createTestUser();

            const [found] = await userRepo.getUserById(created.id);

            expect(found?.id).toBe(created.id);
        });

        it("returns empty array for a well-formed but non-existent id", async () => {
            const found = await userRepo.getUserById(
                "00000000-0000-0000-0000-000000000000"
            );

            expect(found).toEqual([]);
        });
    });

    describe("updateUser", () => {
        it("updates only the provided fields, leaving the rest untouched", async () => {
            const created = await createTestUser();
            await userRepo.updateUser(created.id, { bio: "original bio" });

            const [updated] = await userRepo.updateUser(created.id, {
                name: "Updated Name",
            });
            assertDefined(updated);

            expect(updated.name).toBe("Updated Name");
            expect(updated.bio).toBe("original bio");
            expect(updated.timezone).toBe("UTC");
            expect(updated.nickname).toBe(created.nickname);
        });

        it("leaves a nullable field untouched when it is omitted from the update", async () => {
            const created = await createTestUser();
            await userRepo.updateUser(created.id, { bio: "will be kept" });

            const [updated] = await userRepo.updateUser(created.id, {
                bio: undefined,
            });
            assertDefined(updated);

            expect(updated.bio).toBe("will be kept");
        });

        it("clears a nullable field when it is explicitly set to null", async () => {
            const created = await createTestUser();
            await userRepo.updateUser(created.id, { bio: "will be cleared" });

            const [cleared] = await userRepo.updateUser(created.id, {
                bio: null as any,
            });
            assertDefined(cleared);

            expect(cleared.bio).toBeNull();
        });

        it("bumps updated_at on every update", async () => {
            const created = await createTestUser();

            await new Promise((r) => setTimeout(r, 10));
            const [updated] = await userRepo.updateUser(created.id, {
                name: "Touch",
            });
            assertDefined(updated);

            expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(
                new Date(created.updated_at).getTime()
            );
        });

        it("returns empty array when updating a non-existent id", async () => {
            const result = await userRepo.updateUser(
                "00000000-0000-0000-0000-000000000000",
                { name: "Ghost" }
            );

            expect(result).toEqual([]);
        });

        it("throws when the new email collides with another user", async () => {
            const userA = await createTestUser();
            const userB = await createTestUser();

            await expect(
                userRepo.updateUser(userB.id, { email: userA.email })
            ).rejects.toThrow();
        });
    });

    describe("deleteUser", () => {
        it("deletes an existing user and returns the deleted record", async () => {
            const created = await createTestUser();

            const deleted = await userRepo.deleteUser(created.id);

            expect(deleted.length).toBe(1);
            expect(deleted[0]?.id).toBe(created.id);

            const found = await userRepo.getUserById(created.id);
            expect(found).toEqual([]);
        });

        it("returns 0 affected rows when the id does not exist", async () => {
            const deleted = await userRepo.deleteUser(
                "00000000-0000-0000-0000-000000000000"
            );

            expect(deleted).toEqual([]);
        });
    });
});