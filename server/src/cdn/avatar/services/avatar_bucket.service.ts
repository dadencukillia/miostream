import { GetObjectCommand, NoSuchBucket, NoSuchKey, type GetObjectCommandOutput, type S3Client } from "@aws-sdk/client-s3";

export async function getAvatarBySlug(
  rustfs: S3Client, 
  avatarId: string,
  callbacks?: {
    success: (output: GetObjectCommandOutput) => Promise<void>,
    notFound: () => Promise<void>,
    unknownError: (e: Error) => Promise<void>,
  }
): Promise<GetObjectCommandOutput> {
  let output: GetObjectCommandOutput;

  try {
    output = await rustfs.send(new GetObjectCommand({
      Bucket: "avatars",
      Key: `${ avatarId }.webp`,
      ResponseContentEncoding: "gzip",
    }));
  } catch(e) {
    if (e instanceof NoSuchKey || e instanceof NoSuchBucket) {
      await callbacks?.notFound();
      if (!callbacks) throw e;
      return;
    }

    await callbacks?.unknownError(e as Error);
    if (!callbacks) throw e;
    return;
  }

  await callbacks?.success(output!);
  return output!;
}
