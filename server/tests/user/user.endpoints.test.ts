import { describe, it, expect, mock, beforeEach } from "bun:test";
import Fastify, { type FastifyInstance } from "fastify";
import { UserController } from "../../src/api/user/user.controller";
import { UserService } from "../../src/api/user/user.service";
import {
  UserNotFoundError,
  UserAlreadyExistsError,
  UserInvalidError,
} from "../../src/api/user/user.errors";

const FAKE_ID = "123e4567-e89b-12d3-a456-426614174000";

const FAKE_USER = {
  id: FAKE_ID,
  nickname: "tester",
  name: "Test User",
  email: "test@example.com",
};

const validCreatePayload = {
  nickname: "valid_nick",
  name: "Valid Name",
  email: "valid@example.com",
  password: "password123",
};

describe("User Routes (HTTP)", () => {
  let mockService: UserService;
  let app: FastifyInstance;

  beforeEach(() => {
    mockService = {
      create: mock(),
      getById: mock(),
      update: mock(),
      delete: mock(),
    } as unknown as UserService;

    app = Fastify({ ajv: { customOptions: { unicodeRegExp: true } } });
    const controller = new UserController(mockService);
    app.register(controller.registerRoutes, { prefix: "/api/user" });
  });

  describe("POST /api/user", () => {
    it("returns 201 and the created user on success", async () => {
      (mockService.create as any).mockResolvedValue(FAKE_USER);

      const response = await app.inject({
        method: "POST",
        url: "/api/user",
        payload: validCreatePayload,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(FAKE_USER);
    });

    it("returns 400 on invalid nickname (regex mismatch)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/user",
        payload: { ...validCreatePayload, nickname: "bad@nickname!" },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).ok).toBe(false);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it("returns 400 on invalid email format", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/user",
        payload: { ...validCreatePayload, email: "not-an-email" },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when a required field is missing", async () => {
      const { password, ...withoutPassword } = validCreatePayload;

      const response = await app.inject({
        method: "POST",
        url: "/api/user",
        payload: withoutPassword,
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 400 when the body contains an unknown property", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/user",
        payload: { ...validCreatePayload, isAdmin: true },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 409 when the service reports a duplicate user", async () => {
      (mockService.create as any).mockRejectedValue(
        new UserAlreadyExistsError("User already exists")
      );

      const response = await app.inject({
        method: "POST",
        url: "/api/user",
        payload: validCreatePayload,
      });

      expect(response.statusCode).toBe(409);
      expect(JSON.parse(response.body).ok).toBe(false);
    });

    it("returns 500 with a generic message on an unexpected error", async () => {
      (mockService.create as any).mockRejectedValue(new Error("boom"));

      const response = await app.inject({
        method: "POST",
        url: "/api/user",
        payload: validCreatePayload,
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({ ok: false, message: "Unexpected error" });
    });
  });

  describe("GET /api/user/:id", () => {
    it("returns 200 and the user on success", async () => {
      (mockService.getById as any).mockResolvedValue(FAKE_USER);

      const response = await app.inject({
        method: "GET",
        url: `/api/user/${FAKE_ID}`,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(FAKE_USER);
    });

    it("returns 400 if the id is not a valid UUID", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/user/123-not-a-uuid",
      });

      expect(response.statusCode).toBe(400);
      expect(mockService.getById).not.toHaveBeenCalled();
    });

    it("returns 404 when the service reports the user was not found", async () => {
      (mockService.getById as any).mockRejectedValue(
        new UserNotFoundError("not found")
      );

      const response = await app.inject({
        method: "GET",
        url: `/api/user/${FAKE_ID}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("PATCH /api/user/:id", () => {
    it("returns 200 and the updated user on success", async () => {
      (mockService.update as any).mockResolvedValue({
        ...FAKE_USER,
        name: "New Name",
      });

      const response = await app.inject({
        method: "PATCH",
        url: `/api/user/${FAKE_ID}`,
        payload: { name: "New Name" },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).name).toBe("New Name");
    });

    it("returns 400 if the id param is not a valid UUID", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: "/api/user/not-a-uuid",
        payload: { name: "New Name" },
      });

      expect(response.statusCode).toBe(400);
      expect(mockService.update).not.toHaveBeenCalled();
    });

    it("returns 400 when the body contains an unknown property", async () => {
      const response = await app.inject({
        method: "PATCH",
        url: `/api/user/${FAKE_ID}`,
        payload: { password: "shouldnotbeeditable" },
      });

      expect(response.statusCode).toBe(400);
    });

    it("returns 404 when the service reports the user was not found", async () => {
      (mockService.update as any).mockRejectedValue(
        new UserNotFoundError("not found")
      );

      const response = await app.inject({
        method: "PATCH",
        url: `/api/user/${FAKE_ID}`,
        payload: { name: "New Name" },
      });

      expect(response.statusCode).toBe(404);
    });

    it("returns 400 when the service reports an invalid update", async () => {
      (mockService.update as any).mockRejectedValue(
        new UserInvalidError("Update payload cannot be empty")
      );

      const response = await app.inject({
        method: "PATCH",
        url: `/api/user/${FAKE_ID}`,
        payload: { name: "New Name" },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("DELETE /api/user/:id", () => {
    it("returns 204 with no body on success", async () => {
      (mockService.delete as any).mockResolvedValue(undefined);

      const response = await app.inject({
        method: "DELETE",
        url: `/api/user/${FAKE_ID}`,
      });

      expect(response.statusCode).toBe(204);
      expect(response.body).toBe("");
    });

    it("returns 400 if the id param is not a valid UUID", async () => {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/user/not-a-uuid",
      });

      expect(response.statusCode).toBe(400);
      expect(mockService.delete).not.toHaveBeenCalled();
    });

    it("returns 404 when the service reports the user was not found", async () => {
      (mockService.delete as any).mockRejectedValue(
        new UserNotFoundError("not found")
      );

      const response = await app.inject({
        method: "DELETE",
        url: `/api/user/${FAKE_ID}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
