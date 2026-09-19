import { CreateBucketCommand, HeadBucketCommand, NoSuchBucket, S3Client } from "@aws-sdk/client-s3";
import { Connection } from "../utils/connector";
import * as config from "../config";

/**
  * Creates a bucket with a specified name if it doesn't exist
  *
  * @param client - The S3 client instance
  * @param name - The name of bucket to create
  */
async function initBucket(client: S3Client, name: string): Promise<void> {
  try {
    await client.send(
      new HeadBucketCommand({ Bucket: name }), 
    );
  } catch(e) {
    if (e instanceof NoSuchBucket) {
      await client.send(
        new CreateBucketCommand({ Bucket: name }),
      );
    } else {
      throw e;
    }
  }
}

/**
  * Ensures creation of all mandatory buckets from the array
  *
  * @param client - The S3 client instance
  */
async function configureS3(client: S3Client) {
  const requiredBuckets = ["avatars"];

  await Promise.all(requiredBuckets.map(b => initBucket(client, b)));
}


export const S3Connection: Connection<S3Client> = {
  /**
    * An S3 connection establisher for fastify-connector-plugin
    * Adds an "s3" decorator for the fastify instance
    *
    * @example
    * ```typescript
    * // fastify-connector-plugin adjustments
    * fastify.register(connector, {
    *   retries: 3,
    *   interval: 15 * 1000, // 15 seconds
    *   connections: [
    *     S3Connection
    *   ],
    * });
    *
    * await fastify.ready();
    *
    * const result = await fastify.s3.send(new PutObjectCommand({ ... }));
    * ```
    */

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
