import { test, expect, beforeAll, afterAll, describe } from "bun:test";

import Fastify, { type FastifyInstance } from "fastify";
import connector from "../../src/utils/connector";
import { S3Connection } from "../../src/connections/s3";
import "../../src/context";
import { DeleteObjectCommand, GetObjectCommand, ListBucketsCommand, NoSuchKey, PutObjectCommand } from "@aws-sdk/client-s3";

describe("S3 Integration Tests", () => {
  let fastify: FastifyInstance;
  const bucketsRequired = [ "avatars" ];

  beforeAll(async () => {
    fastify = Fastify({
      logger: false,
      pluginTimeout: 0,
    });

    fastify.register(connector, {
      connections: [S3Connection],
      interval: 1_000,
      retries: 3,
    });

    await fastify.ready();
  });

  afterAll(async () => {
    if (fastify) {
      await fastify.close();
    }
  });

  // Tests

  test("check buckets availability", async () => {
    const commandOutput = await fastify.s3
      .send(new ListBucketsCommand());

    const buckets = commandOutput.Buckets ?? [];

    const everyAvailable = bucketsRequired.every(bucket => buckets.some(b => b.Name === bucket));

    expect(everyAvailable).toBe(true);
  });

  test("file create, read, remove", async () => {
    const fileKey = "testfile";
    const fileContent = "hello, world!";

    await fastify.s3.send(new PutObjectCommand({
      Bucket: bucketsRequired[0],
      Key: fileKey,
      Body: fileContent,
    }));

    const object = await fastify.s3.send(new GetObjectCommand({
      Bucket: bucketsRequired[0],
      Key: fileKey
    }));
    expect(await object.Body?.transformToString()).toBe(fileContent);

    await fastify.s3.send(new DeleteObjectCommand({
      Bucket: bucketsRequired[0],
      Key: fileKey
    }));

    try {
      await fastify.s3.send(new GetObjectCommand({
        Bucket: bucketsRequired[0],
        Key: fileKey
      }));
    } catch(e) {
      expect(e instanceof NoSuchKey).toBe(true);
      return;
    }

    throw "must cause an error";
  });
});
