import { DeleteObjectCommand, GetObjectCommand, NoSuchKey, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";

const BUCKET_NAME = "anime-covers";

export async function setAnimeCoverById(
  s3: S3Client,
  animeId: string,
  content: Buffer,
) {
  const coverFile = `${animeId.replaceAll("-", "").trim()}.webp`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: coverFile,
    ACL: "public-read",
    ContentType: "image/webp",
    Body: content
  }));
}

export async function getAnimeCoverById(
  s3: S3Client,
  animeId: string,
): Promise<{ body: Uint8Array; etag: string | null } | null> {
  const coverFile = `${animeId.replaceAll("-", "").trim()}.webp`;

  try {
    const object = await s3.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: coverFile,
    }));

    if (!object.Body) throw Error("No body in S3 response");

    return {
      body: await object.Body.transformToByteArray(),
      etag: object.ETag ?? null,
    };
  } catch (e) {
    if (e instanceof NoSuchKey) {
      return null;
    }

    throw e;
  }
}

export async function removeAnimeCoverById(
  s3: S3Client,
  animeId: string,
) {
  const coverFile = `${animeId.replaceAll("-", "").trim()}.webp`;

  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: coverFile,
  }));
}
