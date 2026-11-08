import connector from "@utils/connector";
import { S3Connection } from "@/connections/s3";
import { PostgresConnection } from "@/connections/pg";
import { afterAll, beforeAll, describe, expect } from "bun:test";
import Fastify, { FastifyInstance } from "fastify";
import path from "node:path";
import userPlugin from "@/api/user/user.plugin";
import cdnPlugin from "@/cdn/cdn.plugin";
import test from "node:test";

const avatarPicture = await Bun.file(path.join(import.meta.dir, "avatar.png")).bytes();

describe("user avatars", async () => {
  let fastify: FastifyInstance;
  let userId: string = "";

  beforeAll(async () => {
    fastify = Fastify({
      logger: true,
      pluginTimeout: 0,
      ajv: {
        customOptions: {
          unicodeRegExp: true,
          removeAdditional: false,
        }
      },
    });

    await fastify.register(connector, {
      retries: 3,
      interval: 15 * 1000,
      connections: [
        S3Connection,
        PostgresConnection,
      ],
    });

    await fastify.register(userPlugin, { prefix: "/users" });
    await fastify.register(cdnPlugin, { prefix: "/cdn" });

    await fastify.pg.query("DELETE FROM public.users;");
  });

  afterAll(async () => {
    await fastify.pg.query("DELETE FROM public.users;");
    await fastify.close();
  });

  test("create user", async () => {
    const userData = {
      nickname: "tester",
      fullName: "Jack Jackson",
      email: "test@miostream.dev"
    };
    const response = await fastify.inject({
      path: "/users",
      method: "POST",
      payload: {
        ...userData,
        password: "12345678"
      },
      headers: {
        "content-type": "application/json"
      }
    });
    const responsePayload = response.json<{ userId: string, nickname: string, fullName: string, email: string }>();

    userId = responsePayload.userId;

    expect(responsePayload).toMatchObject({
      ...userData,
      avatarId: null
    });
  });

  test("attach avatar to user", async () => {
    const response = await fastify.inject({
      path: `/users/${userId}/avatar`,
      method: "PUT",
      payload: JSON.stringify(avatarPicture.toBase64()),
      headers: {
        "content-type": "application/json"
      }
    });

    const responsePayload = response.json<{ userId: string, avatarId: string }>();
    expect(responsePayload.userId).toBe(userId);
    expect(responsePayload.avatarId).toBeString();
    const firstAvatarId = responsePayload.avatarId;

    {
      const response = await fastify.inject({
        path: `/users/${userId}/avatar`,
        method: "PUT",
        payload: JSON.stringify(avatarPicture.toBase64()),
        headers: {
          "content-type": "application/json"
        }
      });

      const responsePayload = response.json<{ userId: string, avatarId: string }>();
      expect(responsePayload.userId).toBe(userId);
      expect(responsePayload.avatarId).toBeString();
      expect(responsePayload.avatarId).not.toBe(firstAvatarId);
    }
  });

  test("reset user avatar", async () => {
    // Reset first, must be success

    {
      const response = await fastify.inject({
        path: `/users/${userId}/avatar`,
        method: "DELETE",
      });

      const responsePayload = response.json<{ userId: string, avatarId: string }>();
      expect(responsePayload.userId).toBe(userId);
      expect(responsePayload.avatarId).toBeNull();
      expect(response.statusCode).toEqual(200);
    }

    // Reset second time, must return error
    // something like "there already no avatar"

    {
      const response = await fastify.inject({
        path: `/users/${userId}/avatar`,
        method: "DELETE",
      });
      expect(response.statusCode).toEqual(409);
    }

    // Put a new avatar

    const response = await fastify.inject({
      path: `/users/${userId}/avatar`,
      method: "PUT",
      payload: JSON.stringify(avatarPicture.toBase64()),
      headers: {
        "content-type": "application/json"
      }
    });
    const responsePayload = response.json<{ userId: string, avatarId: string }>();
    expect(responsePayload.userId).toBe(userId);
    expect(responsePayload.avatarId).toBeString();

    // Check CDN image availability

    const avatarId = responsePayload.avatarId;
    const avatarImageResponse = await fastify.inject({
      path: `/cdn/avatar/${avatarId}.webp`,
      method: "GET"
    });
    expect(avatarImageResponse.statusCode).toEqual(200);
    expect(avatarImageResponse.headers["content-type"]).toEqual("image/webp");

    // Reset and recheck availability

    {
      const response = await fastify.inject({
        path: `/users/${userId}/avatar`,
        method: "DELETE",
      });

      const responsePayload = response.json<{ userId: string, avatarId: string }>();
      expect(responsePayload.userId).toBe(userId);
      expect(responsePayload.avatarId).toBeNull();

      const avatarImageResponse = await fastify.inject({
        path: `/cdn/avatar/${avatarId}.webp`,
        method: "GET"
      });
      expect(avatarImageResponse.statusCode).toEqual(404);
    }
  });
});
