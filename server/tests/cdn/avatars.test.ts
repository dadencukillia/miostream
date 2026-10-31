import { test, beforeAll, expect, describe, afterEach } from "bun:test";
import { S3Client, CreateBucketCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { setAvatarById, getAvatarById, removeAvatarById } from "../../src/cdn/avatar/avatarBucket.repo";
import * as config from "../../src/config";

const BUCKET_NAME = "avatars";

describe("Avatar S3 & Image Service Integration Tests", () => {
  let s3Client: S3Client;

  beforeAll(async () => {
    s3Client = new S3Client({
      endpoint: `http://${ config.RUSTFS_HOST }`,
      region: "us-east-1",
      credentials: {
        accessKeyId: config.RUSTFS_ACCESS_KEY,
        secretAccessKey: config.RUSTFS_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
    } catch (e) {
    }
  });

  async function createSampleImageBuffer(): Promise<Buffer> {
    return await sharp({
      create: {
        width: 256,
        height: 256,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .webp()
      .toBuffer();
  }

  // Tests

  describe("Avatar CRUD Operations", () => {
    const testAvatarId = "user-123-test";

    afterEach(async () => {
      await removeAvatarById(s3Client, testAvatarId);
    });

    test("setAvatarById(), getAvatarById() sequence", async () => {
      const sampleImage = await createSampleImageBuffer();

      await setAvatarById(s3Client, testAvatarId, sampleImage);

      const downloadedAvatar = await getAvatarById(s3Client, testAvatarId);

      expect(downloadedAvatar).not.toBeNull();
      expect(downloadedAvatar).toBeInstanceOf(Uint8Array);
      
      const downloadedMetadata = await sharp(downloadedAvatar!).metadata();
      expect(downloadedMetadata.format).toBe("webp");
      expect(downloadedMetadata.width).toBe(256);
    });

    test("getAvatarById() null if avatar doesn't exist", async () => {
      const nonExistentAvatar = await getAvatarById(s3Client, "non-existent-user-id");

      expect(nonExistentAvatar).toBeNull();
    });

    test("removeAvatarById()", async () => {
      const sampleImage = await createSampleImageBuffer();

      await setAvatarById(s3Client, testAvatarId, sampleImage);

      await removeAvatarById(s3Client, testAvatarId);

      const result = await getAvatarById(s3Client, testAvatarId);
      expect(result).toBeNull();
    });
  });

  // TODO: tests for database interactions
});
