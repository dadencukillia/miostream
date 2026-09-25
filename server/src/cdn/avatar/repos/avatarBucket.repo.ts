import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";

const BUCKET_NAME = "avatars";

export async function setAvatarById(
  s3: S3Client,
  avatarId: string,
  content: Buffer,
) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `${avatarId}.webp`,
    ACL: "public-read",
    ContentType: "image/webp",
    Body: content
  }));
}

export async function getAvatarById(
  s3: S3Client,
  avatarId: string,
): Promise<Uint8Array|null> {
  try {
    const object = await s3.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${avatarId}.webp`,
      ResponseContentEncoding: "gzip",
    }));

    return object.Body!.transformToByteArray();
  } catch(e) {
    if (e instanceof NoSuchKey) {
      return null;
    }

    throw e;
  }
}

export async function removeAvatarById(
  s3: S3Client,
  avatarId: string,
) {
  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `${avatarId}.webp`,
  }));
}
