import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import * as userRepo from "../../src/api/user/repository";
import * as userService from "../../src/api/user/service";
import {
    UserError,
    UserInvalidError,
    UserNotFoundError,
    UserAlreadyExistsError,
} from "../../src/api/user/errors";

const FAKE_ID = "00000000-0000-0000-0000-000000000000";
const INVALID_UUID = "not-a-valid-uuid";

const FAKE_USER = {
    id: FAKE_ID,
    nickname: "tester",
    name: "Test User",
    email: "test@example.com",
    password_hash: "hashed_longenoughpassword",
    bio: null,
    avatar_url: null,
    social_networks: null, // Test that toUserModel normalizes null to []
    current_streak: 0,
    max_streak: 0,
    timezone: "UTC",
    last_action: new Date(),
    profile_frame: "DEFAULT" as const,
    profile_background: "DEFAULT" as const,
    created_at: new Date(),
    updated_at: new Date(),
};

describe("user.service", () => {
    let mockCreateUser: ReturnType<typeof spyOn<typeof userRepo, "createUser">>;
    let mockGetUserById: ReturnType<typeof spyOn<typeof userRepo, "getUserById">>;
    let mockUpdateUser: ReturnType<typeof spyOn<typeof userRepo, "updateUser">>;
    let mockDeleteUser: ReturnType<typeof spyOn<typeof userRepo, "deleteUser">>;

    beforeEach(() => {
        mockCreateUser = spyOn(userRepo, "createUser");
        mockGetUserById = spyOn(userRepo, "getUserById");
        mockUpdateUser = spyOn(userRepo, "updateUser");
        mockDeleteUser = spyOn(userRepo, "deleteUser");
    });

    afterEach(() => {
        mockCreateUser.mockRestore();
        mockGetUserById.mockRestore();
        mockUpdateUser.mockRestore();
        mockDeleteUser.mockRestore();
    });

    describe("createUser", () => {
        const validInput = {
            nickname: "tester",
            name: "Test User",
            email: "test@example.com",
            password: "longenoughpassword",
        };

        describe("validation", () => {
            it("throws UserInvalidError if password is missing", async () => {
                await expect(userService.createUser({ ...validInput, password: "" as any })).rejects.toThrow(UserInvalidError);
                await expect(userService.createUser({ ...validInput, password: undefined as any })).rejects.toThrow(UserInvalidError);
                expect(mockCreateUser).not.toHaveBeenCalled();
            });

            it("throws UserInvalidError if password is shorter than 8 characters", async () => {
                await expect(userService.createUser({ ...validInput, password: "short" })).rejects.toThrow(UserInvalidError);
                expect(mockCreateUser).not.toHaveBeenCalled();
            });

            it("throws UserInvalidError if password exceeds 128 characters", async () => {
                await expect(userService.createUser({ ...validInput, password: "a".repeat(129) })).rejects.toThrow(UserInvalidError);
                expect(mockCreateUser).not.toHaveBeenCalled();
            });

            it("throws UserInvalidError if nickname is missing or empty", async () => {
                await expect(userService.createUser({ ...validInput, nickname: "" })).rejects.toThrow(UserInvalidError);
                await expect(userService.createUser({ ...validInput, nickname: "   " })).rejects.toThrow(UserInvalidError);
            });

            it("throws UserInvalidError on invalid nickname format or length", async () => {
                await expect(userService.createUser({ ...validInput, nickname: "ab" })).rejects.toThrow(UserInvalidError);
                await expect(userService.createUser({ ...validInput, nickname: "a".repeat(31) })).rejects.toThrow(UserInvalidError);
                await expect(userService.createUser({ ...validInput, nickname: "user@name" })).rejects.toThrow(UserInvalidError);
                await expect(userService.createUser({ ...validInput, nickname: "user name" })).rejects.toThrow(UserInvalidError);
            });

            it("throws UserInvalidError if name is missing or empty", async () => {
                await expect(userService.createUser({ ...validInput, name: "" })).rejects.toThrow(UserInvalidError);
                await expect(userService.createUser({ ...validInput, name: "   " })).rejects.toThrow(UserInvalidError);
            });

            it("throws UserInvalidError if name length is outside 3 to 100 characters", async () => {
                await expect(userService.createUser({ ...validInput, name: "ab" })).rejects.toThrow(UserInvalidError);
                await expect(userService.createUser({ ...validInput, name: "a".repeat(101) })).rejects.toThrow(UserInvalidError);
            });

            it("throws UserInvalidError if email is missing or empty", async () => {
                await expect(userService.createUser({ ...validInput, email: "" })).rejects.toThrow(UserInvalidError);
                await expect(userService.createUser({ ...validInput, email: "   " })).rejects.toThrow(UserInvalidError);
            });

            it("throws UserInvalidError on invalid email format", async () => {
                await expect(userService.createUser({ ...validInput, email: "invalid-email" })).rejects.toThrow(UserInvalidError);
                await expect(userService.createUser({ ...validInput, email: "invalid@domain" })).rejects.toThrow(UserInvalidError);
                await expect(userService.createUser({ ...validInput, email: "@domain.com" })).rejects.toThrow(UserInvalidError);
            });
        });

        describe("execution & DB errors", () => {
            it("hashes password and returns created user with normalized social_networks", async () => {
                mockCreateUser.mockResolvedValue([FAKE_USER as any]);

                const result = await userService.createUser(validInput);

                expect(mockCreateUser).toHaveBeenCalledWith({
                    nickname: validInput.nickname,
                    name: validInput.name,
                    email: validInput.email,
                    password_hash: "hashed_" + validInput.password,
                });
                expect(result).toEqual({ ...FAKE_USER, social_networks: [] } as any);
            });

            it("throws UserError when the repository returns an empty array", async () => {
                mockCreateUser.mockResolvedValue([]);
                await expect(userService.createUser(validInput)).rejects.toThrow(UserError);
            });

            it("handles Postgres 23505 unique error for nickname", async () => {
                mockCreateUser.mockRejectedValue({ code: "23505", detail: 'Key ("nickname")=(tester) already exists.' });
                await expect(userService.createUser(validInput)).rejects.toThrow(UserAlreadyExistsError);
            });

            it("handles Postgres 23505 unique error for email", async () => {
                mockCreateUser.mockRejectedValue({ code: "23505", detail: 'Key ("email")=(test@example.com) already exists.' });
                await expect(userService.createUser(validInput)).rejects.toThrow(UserAlreadyExistsError);
            });

            it("handles Postgres 23505 unique error with fallback message", async () => {
                mockCreateUser.mockRejectedValue({ code: "23505", detail: "unique constraint violation" });
                await expect(userService.createUser(validInput)).rejects.toThrow(UserAlreadyExistsError);
            });

            it("handles Postgres 22001 string length limit error", async () => {
                mockCreateUser.mockRejectedValue({ code: "22001", message: "value too long for type character varying" });
                await expect(userService.createUser(validInput)).rejects.toThrow(UserInvalidError);
            });

            it("propagates unhandled database errors unchanged", async () => {
                mockCreateUser.mockRejectedValue(new Error("connection terminated"));
                await expect(userService.createUser(validInput)).rejects.toThrow("connection terminated");
            });
        });
    });

    describe("getUserById", () => {
        describe("validation", () => {
            it("throws UserInvalidError for empty or whitespace-only id", async () => {
                await expect(userService.getUserById("")).rejects.toThrow(UserInvalidError);
                await expect(userService.getUserById("   ")).rejects.toThrow(UserInvalidError);
            });

            it("throws UserInvalidError if id is not a valid UUID", async () => {
                await expect(userService.getUserById(INVALID_UUID)).rejects.toThrow(UserInvalidError);
                expect(mockGetUserById).not.toHaveBeenCalled();
            });
        });

        describe("execution & DB errors", () => {
            it("returns user with normalized social_networks on success", async () => {
                mockGetUserById.mockResolvedValue([FAKE_USER as any]);

                const result = await userService.getUserById(FAKE_ID);

                expect(mockGetUserById).toHaveBeenCalledWith(FAKE_ID);
                expect(result).toEqual({ ...FAKE_USER, social_networks: [] } as any);
            });

            it("throws UserNotFoundError when repository returns no row", async () => {
                mockGetUserById.mockResolvedValue([]);
                await expect(userService.getUserById(FAKE_ID)).rejects.toThrow(UserNotFoundError);
            });

            it("handles Postgres 22P02 invalid data format error", async () => {
                mockGetUserById.mockRejectedValue({ code: "22P02", message: "invalid input syntax for type uuid" });
                await expect(userService.getUserById(FAKE_ID)).rejects.toThrow(UserInvalidError);
            });

            it("propagates unexpected repository errors unchanged", async () => {
                mockGetUserById.mockRejectedValue(new Error("network error"));
                await expect(userService.getUserById(FAKE_ID)).rejects.toThrow("network error");
            });
        });
    });

    describe("updateUser", () => {
        const patch = { name: "Updated Name" };

        describe("validation", () => {
            it("throws UserInvalidError for empty or whitespace-only id", async () => {
                await expect(userService.updateUser("", patch)).rejects.toThrow(UserInvalidError);
                await expect(userService.updateUser("   ", patch)).rejects.toThrow(UserInvalidError);
            });

            it("throws UserInvalidError for invalid UUID", async () => {
                await expect(userService.updateUser(INVALID_UUID, patch)).rejects.toThrow(UserInvalidError);
            });

            it("throws UserInvalidError for empty update payload", async () => {
                await expect(userService.updateUser(FAKE_ID, {})).rejects.toThrow(UserInvalidError);
                expect(mockUpdateUser).not.toHaveBeenCalled();
            });

            it("validates nickname when provided", async () => {
                await expect(userService.updateUser(FAKE_ID, { nickname: "no" })).rejects.toThrow(UserInvalidError);
                await expect(userService.updateUser(FAKE_ID, { nickname: "invalid!name" })).rejects.toThrow(UserInvalidError);
            });

            it("validates name length when provided", async () => {
                await expect(userService.updateUser(FAKE_ID, { name: "ab" })).rejects.toThrow(UserInvalidError);
                await expect(userService.updateUser(FAKE_ID, { name: "a".repeat(101) })).rejects.toThrow(UserInvalidError);
            });

            it("validates email format when provided", async () => {
                await expect(userService.updateUser(FAKE_ID, { email: "not-an-email" })).rejects.toThrow(UserInvalidError);
            });

            it("validates last_action date format when provided", async () => {
                await expect(userService.updateUser(FAKE_ID, { last_action: "not-a-date" })).rejects.toThrow(UserInvalidError);
            });

            it("validates social_networks is an array when provided", async () => {
                await expect(userService.updateUser(FAKE_ID, { social_networks: "not-an-array" as any })).rejects.toThrow(UserInvalidError);
            });
        });

        describe("execution & DB errors", () => {
            it("returns the updated user on success", async () => {
                mockUpdateUser.mockResolvedValue([{ ...FAKE_USER, name: "Updated Name" } as any]);

                const result = await userService.updateUser(FAKE_ID, patch);

                expect(mockUpdateUser).toHaveBeenCalledWith(FAKE_ID, patch);
                expect(result.name).toBe("Updated Name");
                expect(result.social_networks).toEqual([]);
            });

            it("throws UserError when repository returns no row", async () => {
                mockUpdateUser.mockResolvedValue([]);
                await expect(userService.updateUser(FAKE_ID, patch)).rejects.toThrow(UserError);
            });

            it("handles Postgres 23505 unique error during update", async () => {
                mockUpdateUser.mockRejectedValue({ code: "23505", detail: 'Key ("email")=(taken@example.com) already exists.' });
                await expect(userService.updateUser(FAKE_ID, { email: "taken@example.com" })).rejects.toThrow(UserAlreadyExistsError);
            });

            it("handles Postgres 22007 date format error", async () => {
                mockUpdateUser.mockRejectedValue({ code: "22007", message: "invalid date format" });
                await expect(userService.updateUser(FAKE_ID, patch)).rejects.toThrow(UserInvalidError);
            });

            it("propagates unhandled database errors unchanged", async () => {
                mockUpdateUser.mockRejectedValue(new Error("query timeout"));
                await expect(userService.updateUser(FAKE_ID, patch)).rejects.toThrow("query timeout");
            });
        });
    });

    describe("deleteUser", () => {
        describe("validation", () => {
            it("throws UserInvalidError for empty or whitespace-only id", async () => {
                await expect(userService.deleteUser("")).rejects.toThrow(UserInvalidError);
                await expect(userService.deleteUser("   ")).rejects.toThrow(UserInvalidError);
            });

            it("throws UserInvalidError for invalid UUID", async () => {
                await expect(userService.deleteUser(INVALID_UUID)).rejects.toThrow(UserInvalidError);
                expect(mockDeleteUser).not.toHaveBeenCalled();
            });
        });

        describe("execution & DB errors", () => {
            it("resolves without error when user is deleted", async () => {
                mockDeleteUser.mockResolvedValue([FAKE_USER as any]);
                await expect(userService.deleteUser(FAKE_ID)).resolves.toBeUndefined();
                expect(mockDeleteUser).toHaveBeenCalledWith(FAKE_ID);
            });

            it("throws UserError when repository reports zero deleted rows", async () => {
                mockDeleteUser.mockResolvedValue([]);
                await expect(userService.deleteUser(FAKE_ID)).rejects.toThrow(UserError);
            });

            it("handles Postgres 22P02 format error during deletion", async () => {
                mockDeleteUser.mockRejectedValue({ code: "22P02", message: "invalid input syntax for type uuid" });
                await expect(userService.deleteUser(FAKE_ID)).rejects.toThrow(UserInvalidError);
            });

            it("propagates unhandled database errors unchanged", async () => {
                mockDeleteUser.mockRejectedValue(new Error("foreign key constraint"));
                await expect(userService.deleteUser(FAKE_ID)).rejects.toThrow("foreign key constraint");
            });
        });
    });
});