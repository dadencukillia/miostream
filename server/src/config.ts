import { readFileSync } from "node:fs";

// Services host
export const POSTGRES_HOST = process.env['POSTGRES_HOST'] ?? "localhost:5432";
export const REDIS_HOST = process.env['REDIS_HOST'] ?? "localhost:6379";
export const RUSTFS_HOST = process.env['RUSTFS_HOST'] ?? "localhost:9000";

export const DB_NAME = "miostream";
export const DB_PASS = process.env["DB_PASS"] ?? readFileSync(process.env["DB_PASS_FILE"]!, "utf-8").trim();
export const DB_URL = `postgresql://postgres:${DB_PASS}@${POSTGRES_HOST}/${DB_NAME}`;
