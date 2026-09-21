import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import * as userRepo from "../../src/api/user/user.repository";
import * as userService from "../../src/api/user/user.service";
import {
  UserError,
  UserInvalidError,
  UserNotFoundError,
} from "../../src/api/user/user.errors";

const FAKE_ID = "00000000-0000-0000-0000-000000000000";

const FAKE_USER = {
  id: FAKE_ID,
  nickname: "tester",
  name: "Test User",
  email: "test@example.com",
  password_hash: "hashedPassword",
  bio: null,
  avatar_url: null,
  social_networks: [],
  current_streak: 0,
  max_streak: 0,
  timezone: "UTC",
  last_action: new Date(),
  profile_frame: "DEFAULT",
  profile_background: "DEFAULT",
  created_at: new Date(),
  updated_at: new Date(),
} as any;

describe("user.service", () => {
  let mockCreateUser: ReturnType<typeof spyOn<typeof userRepo, "createUser">>;
  let mockGetUserById: ReturnType<typeof spyOn<typeof userRepo, "getUserById">>;
  let mockGetUserByEmail: ReturnType<typeof spyOn<typeof userRepo, "getUserByEmail">>;
  let mockUpdateUser: ReturnType<typeof spyOn<typeof userRepo, "updateUser">>;
  let mockDeleteUser: ReturnType<typeof spyOn<typeof userRepo, "deleteUser">>;

  beforeEach(() => {
    mockCreateUser = spyOn(userRepo, "createUser");
    mockGetUserById = spyOn(userRepo, "getUserById");
    mockGetUserByEmail = spyOn(userRepo, "getUserByEmail");
    mockUpdateUser = spyOn(userRepo, "updateUser");
    mockDeleteUser = spyOn(userRepo, "deleteUser");
  });

  afterEach(() => {
    mockCreateUser.mockRestore();
    mockGetUserById.mockRestore();
    mockGetUserByEmail.mockRestore();
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

    it("throws UserInvalidError if password is missing", async () => {
      await expect(
        userService.createUser({ ...validInput, password: undefined as any })
      ).rejects.toThrow(UserInvalidError);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("throws UserInvalidError if password is shorter than 8 characters", async () => {
      await expect(
        userService.createUser({ ...validInput, password: "short" })
      ).rejects.toThrow(UserInvalidError);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it("calls the repository without the plaintext password", async () => {
      mockCreateUser.mockResolvedValue([FAKE_USER]);

      await userService.createUser(validInput);

      expect(mockCreateUser).toHaveBeenCalledTimes(1);
      const repoArg = mockCreateUser.mock.calls[0]?.[0] as any;
      expect(repoArg.password).toBeUndefined();
      expect(repoArg.password_hash).toBeTruthy();
      expect(repoArg.nickname).toBe(validInput.nickname);
      expect(repoArg.email).toBe(validInput.email);
    });

    it("returns the created user on success", async () => {
      mockCreateUser.mockResolvedValue([FAKE_USER]);

      const result = await userService.createUser(validInput);

      expect(result).toEqual(FAKE_USER);
    });

    it("throws a generic UserError when the repository returns no row", async () => {
      mockCreateUser.mockResolvedValue([]);

      await expect(userService.createUser(validInput)).rejects.toThrow(UserError);
    });

    it("propagates repository errors unchanged", async () => {
      mockCreateUser.mockRejectedValue(new Error("connection reset"));

      const promise = userService.createUser(validInput);
      await expect(promise).rejects.toThrow("connection reset");
      await expect(promise).rejects.not.toBeInstanceOf(UserError);
    });
  });

  describe("getUserById", () => {
    it("throws UserInvalidError for an empty id", async () => {
      await expect(userService.getUserById("")).rejects.toThrow(UserInvalidError);
    });

    it("throws UserInvalidError for a whitespace-only id", async () => {
      await expect(userService.getUserById("   ")).rejects.toThrow(UserInvalidError);
    });

    it("throws UserNotFoundError when the repository returns no row", async () => {
      mockGetUserById.mockResolvedValue([]);

      await expect(userService.getUserById(FAKE_ID)).rejects.toThrow(UserNotFoundError);
    });

    it("returns the user when found", async () => {
      mockGetUserById.mockResolvedValue([FAKE_USER]);

      const result = await userService.getUserById(FAKE_ID);

      expect(result).toEqual(FAKE_USER);
    });
  });

  describe("updateUser", () => {
    const patch = { name: "New Name" };

    it("throws UserInvalidError for an empty id", async () => {
      await expect(userService.updateUser("", patch)).rejects.toThrow(UserInvalidError);
    });

    it("throws UserInvalidError for an empty update payload", async () => {
      await expect(userService.updateUser(FAKE_ID, {})).rejects.toThrow(UserInvalidError);
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("throws a generic UserError, not UserNotFoundError, when the repository returns no row", async () => {
      mockUpdateUser.mockResolvedValue([]);

      const promise = userService.updateUser(FAKE_ID, patch);
      await expect(promise).rejects.toThrow(UserError);
      await expect(promise).rejects.not.toBeInstanceOf(UserNotFoundError);
    });

    it("propagates repository errors unchanged", async () => {
      mockUpdateUser.mockRejectedValue(new Error("timeout"));

      await expect(userService.updateUser(FAKE_ID, patch)).rejects.toThrow("timeout");
    });

    it("returns the updated user on success", async () => {
      mockUpdateUser.mockResolvedValue([{ ...FAKE_USER, name: "New Name" }]);

      const result = await userService.updateUser(FAKE_ID, patch);

      expect(result.name).toBe("New Name");
    });
  });

  describe("deleteUser", () => {
    it("throws UserInvalidError for an empty id", async () => {
      await expect(userService.deleteUser("")).rejects.toThrow(UserInvalidError);
    });

    it("throws a generic UserError when the repository reports zero affected rows", async () => {
      mockDeleteUser.mockResolvedValue(0);

      await expect(userService.deleteUser(FAKE_ID)).rejects.toThrow(UserError);
    });

    it("propagates repository errors unchanged", async () => {
      mockDeleteUser.mockRejectedValue(new Error("fk violation"));

      await expect(userService.deleteUser(FAKE_ID)).rejects.toThrow("fk violation");
    });

    it("resolves without error when a row is deleted", async () => {
      mockDeleteUser.mockResolvedValue(1);

      await expect(userService.deleteUser(FAKE_ID)).resolves.toBeUndefined();
    });
  });
});