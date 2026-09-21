import { describe, it, expect, mock, beforeEach } from "bun:test";
import type { IUserRepository } from "../../src/api/user/user.repository";
import { UserService } from "../../src/api/user/user.service";
import {
  UserError,
  UserInvalidError,
  UserNotFoundError,
  UserAlreadyExistsError,
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

describe("UserService", () => {
  let mockRepo: IUserRepository;
  let service: UserService;

  beforeEach(() => {
    mockRepo = {
      create: mock(),
      getById: mock(),
      getByEmail: mock(),
      update: mock(),
      delete: mock(),
    };
    service = new UserService(mockRepo);
  });

  describe("create", () => {
    const validInput = {
      nickname: "tester",
      name: "Test User",
      email: "test@example.com",
      password: "longenoughpassword",
    };

    it("throws UserInvalidError if password is missing", async () => {
      await expect(
        service.create({ ...validInput, password: undefined as any })
      ).rejects.toThrow(UserInvalidError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("throws UserInvalidError if password is shorter than 8 characters", async () => {
      await expect(
        service.create({ ...validInput, password: "short" })
      ).rejects.toThrow(UserInvalidError);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("calls the repository without the plaintext password", async () => {
      (mockRepo.create as any).mockResolvedValue(FAKE_USER);

      await service.create(validInput);

      expect(mockRepo.create).toHaveBeenCalledTimes(1);
      const repoArg = (mockRepo.create as any).mock.calls[0][0];
      expect(repoArg.password).toBeUndefined();
      expect(repoArg.password_hash).toBeTruthy();
      expect(repoArg.nickname).toBe(validInput.nickname);
      expect(repoArg.email).toBe(validInput.email);
    });

    it("returns the created user on success", async () => {
      (mockRepo.create as any).mockResolvedValue(FAKE_USER);

      const result = await service.create(validInput);

      expect(result).toEqual(FAKE_USER);
    });

    it("re-throws UserError subclasses from the repo unchanged", async () => {
      const original = new UserAlreadyExistsError("duplicate nickname/email");
      (mockRepo.create as any).mockRejectedValue(original);

      await expect(service.create(validInput)).rejects.toThrow(
        UserAlreadyExistsError
      );
    });

    it("wraps unexpected repo errors in a generic UserError", async () => {
      (mockRepo.create as any).mockRejectedValue(new Error("connection reset"));

      const promise = service.create(validInput);
      await expect(promise).rejects.toThrow(UserError);
      await expect(promise).rejects.not.toThrow(UserAlreadyExistsError);
    });
  });

  describe("getById", () => {
    it("throws UserInvalidError for an empty id", async () => {
      await expect(service.getById("")).rejects.toThrow(UserInvalidError);
    });

    it("throws UserInvalidError for a whitespace-only id", async () => {
      await expect(service.getById("   ")).rejects.toThrow(UserInvalidError);
    });

    it("throws UserNotFoundError if the repo returns null", async () => {
      (mockRepo.getById as any).mockResolvedValue(null);

      await expect(service.getById(FAKE_ID)).rejects.toThrow(
        UserNotFoundError
      );
    });

    it("returns the user when found", async () => {
      (mockRepo.getById as any).mockResolvedValue(FAKE_USER);

      const result = await service.getById(FAKE_ID);

      expect(result).toEqual(FAKE_USER);
    });
  });

  describe("update", () => {
    const patch = { name: "New Name" };

    it("throws UserInvalidError for an empty id", async () => {
      await expect(service.update("", patch)).rejects.toThrow(
        UserInvalidError
      );
    });

    it("throws UserInvalidError for an empty update payload", async () => {
      await expect(service.update(FAKE_ID, {})).rejects.toThrow(
        UserInvalidError
      );
      expect(mockRepo.getById).not.toHaveBeenCalled();
    });

    it("throws UserNotFoundError if the user does not exist", async () => {
      (mockRepo.getById as any).mockResolvedValue(null);

      await expect(service.update(FAKE_ID, patch)).rejects.toThrow(
        UserNotFoundError
      );
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("throws UserNotFoundError if the row is deleted between the existence check and the update", async () => {
      (mockRepo.getById as any).mockResolvedValue(FAKE_USER);
      (mockRepo.update as any).mockResolvedValue(null);

      await expect(service.update(FAKE_ID, patch)).rejects.toThrow(
        UserNotFoundError
      );
    });

    it("re-throws UserError subclasses from repo.update unchanged", async () => {
      (mockRepo.getById as any).mockResolvedValue(FAKE_USER);
      (mockRepo.update as any).mockRejectedValue(
        new UserAlreadyExistsError("email taken")
      );

      await expect(service.update(FAKE_ID, patch)).rejects.toThrow(
        UserAlreadyExistsError
      );
    });

    it("wraps unexpected repo.update errors in a generic UserError", async () => {
      (mockRepo.getById as any).mockResolvedValue(FAKE_USER);
      (mockRepo.update as any).mockRejectedValue(new Error("timeout"));

      const promise = service.update(FAKE_ID, patch);
      await expect(promise).rejects.toThrow(UserError);
      await expect(promise).rejects.not.toThrow(UserNotFoundError);
    });

    it("returns the updated user on success", async () => {
      (mockRepo.getById as any).mockResolvedValue(FAKE_USER);
      const updated = { ...FAKE_USER, name: "New Name" };
      (mockRepo.update as any).mockResolvedValue(updated);

      const result = await service.update(FAKE_ID, patch);

      expect(result.name).toBe("New Name");
    });
  });

  describe("delete", () => {
    it("throws UserInvalidError for an empty id", async () => {
      await expect(service.delete("")).rejects.toThrow(UserInvalidError);
    });

    it("throws UserNotFoundError if the user does not exist", async () => {
      (mockRepo.getById as any).mockResolvedValue(null);

      await expect(service.delete(FAKE_ID)).rejects.toThrow(
        UserNotFoundError
      );
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it("throws UserNotFoundError if repo.delete reports nothing was deleted", async () => {
      (mockRepo.getById as any).mockResolvedValue(FAKE_USER);
      (mockRepo.delete as any).mockResolvedValue(false);

      await expect(service.delete(FAKE_ID)).rejects.toThrow(
        UserNotFoundError
      );
    });

    it("wraps unexpected repo.delete errors in a generic UserError", async () => {
      (mockRepo.getById as any).mockResolvedValue(FAKE_USER);
      (mockRepo.delete as any).mockRejectedValue(new Error("fk violation"));

      await expect(service.delete(FAKE_ID)).rejects.toThrow(UserError);
    });

    it("resolves without error on success", async () => {
      (mockRepo.getById as any).mockResolvedValue(FAKE_USER);
      (mockRepo.delete as any).mockResolvedValue(true);

      await expect(service.delete(FAKE_ID)).resolves.toBeUndefined();
    });
  });
});
