import { S3Client } from "@aws-sdk/client-s3";
import { Pool } from 'pg';
import { AuthInfo } from "./api/auth/auth.middleware";

declare module 'fastify' {
  interface FastifyInstance {
    s3: S3Client;
    pg: Pool;
  }
  
  interface FastifyRequest {
		auth?: AuthInfo;
	}
}
