import { S3Client } from "@aws-sdk/client-s3";
import { Pool } from 'pg';

declare module 'fastify' {
  interface FastifyInstance {
    s3: S3Client;
    pg: Pool;
  }
  
  interface FastifyRequest {
		user?: { id: number };
	}
}
