import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { Connection } from "../utils/connector";
import * as config from "../config";

async function initBucket(client: S3Client, name: string): Promise<void> {
  try {
    await client.send(
      new HeadBucketCommand({ Bucket: name }), 
    );
  } catch {
    await client.send(
      new CreateBucketCommand({ Bucket: name }),
    );
  }
}

async function configureS3(client: S3Client) {
  const requiredBuckets = ["avatars"];

  await Promise.all(requiredBuckets.map(b => initBucket(client, b)));
}

export const S3Connection: Connection<S3Client> = {
  name: "s3",

  async initFunc(_fastify) {
    const client = new S3Client({
      endpoint: `http://${ config.RUSTFS_HOST }`,
      region: "us-east-1",
      credentials: {
        accessKeyId: config.RUSTFS_ACCESS_KEY,
        secretAccessKey: config.RUSTFS_SECRET_KEY,
      },
      forcePathStyle: true,
    });

    await configureS3(client);
    return client;
  },

  async dropFunc(_fastify, instance) {
    instance.destroy();
  }
};
