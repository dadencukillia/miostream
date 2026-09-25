import { S3Client } from "@aws-sdk/client-s3";

declare module 'fastify' {
  interface FastifyInstance {
    s3: S3Client;
  }
}
