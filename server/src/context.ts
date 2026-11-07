import type { S3Client } from "@aws-sdk/client-s3";
import type { Pool } from 'pg';
import type { AuthContext } from "./api/auth/auth.middleware";

declare module 'fastify' {
  interface FastifyInstance {
    s3: S3Client;
    pg: Pool;
  }
  
  interface FastifyRequest {
		auth?: AuthContext;
	}
}
