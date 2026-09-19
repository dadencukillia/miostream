import { DeleteObjectCommand, GetObjectCommand, NoSuchBucket, NoSuchKey, PutObjectCommand, type DeleteObjectCommandOutput, type GetObjectCommandOutput, type PutObjectCommandOutput, type S3Client } from "@aws-sdk/client-s3";

const BUCKET_NAME = "avatars";

export async function setAvatarBySlug(
  rustfs: S3Client, 
  avatarId: string,
  content: Buffer,
  callbacks?: {
    success: (output: GetObjectCommandOutput) => Promise<void>,
    unknownError: (e: Error) => Promise<void>,
  }
): Promise<PutObjectCommandOutput|null> {
  let output: PutObjectCommandOutput;

  try {
    output = await rustfs.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${avatarId}.webp`,
      ACL: "public-read",
      ContentType: "image/webp",
      Body: content
    }));
  } catch(e) {
    if (!callbacks) throw e;

    await callbacks?.unknownError(e as Error);
    return null;
  }

  await callbacks?.success(output!);
  return output;
}

export async function getAvatarBySlug(
  rustfs: S3Client, 
  avatarId: string,
  callbacks?: {
    success: (output: GetObjectCommandOutput) => Promise<void>,
    notFound: () => Promise<void>,
    unknownError: (e: Error) => Promise<void>,
  }
): Promise<GetObjectCommandOutput|null> {
  let output: GetObjectCommandOutput;

  try {
    output = await rustfs.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${avatarId}.webp`,
      ResponseContentEncoding: "gzip",
    }));
  } catch(e) {
    if (!callbacks) throw e;

    if (e instanceof NoSuchKey || e instanceof NoSuchBucket) {
      await callbacks?.notFound();
      return null;
    }

    await callbacks?.unknownError(e as Error);
    return null;
  }

  await callbacks?.success(output!);
  return output;
}

export async function removeAvatarBySlug(
  rustfs: S3Client,
  avatarId: string,
  callbacks?: {
    success: (output: GetObjectCommandOutput) => Promise<void>,
    unknownError: (e: Error) => Promise<void>,
  }
): Promise<DeleteObjectCommandOutput|null> {
  let output: DeleteObjectCommandOutput;

  try {
    output = await rustfs.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${avatarId}.webp`,
    }));
  } catch(e) {
    if (!callbacks) throw e;

    await callbacks?.unknownError(e as Error);
    return null;
  }

  await callbacks?.success(output!);
  return output;
}
