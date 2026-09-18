import { readFileSync } from "node:fs";

// Services host
export const POSTGRES_HOST = process.env['POSTGRES_HOST'] ?? "localhost:5432";
export const REDIS_HOST = process.env['REDIS_HOST'] ?? "localhost:6379";
export const RUSTFS_HOST = process.env['RUSTFS_HOST'] ?? "localhost:9000";

export const DB_NAME = "miostream";
export const DB_PASS = process.env["DB_PASS"] ?? readFileSync(process.env["DB_PASS_FILE"]!, "utf-8").trim();
export const DB_URL = `postgresql://postgres:${DB_PASS}@${POSTGRES_HOST}/${DB_NAME}`;

export const RUSTFS_ACCESS_KEY = process.env["RUSTFS_ACCESS_KEY"] ?? readFileSync(process.env["RUSTFS_ACCESS_KEY_FILE"]!, "utf-8").trim();
export const RUSTFS_SECRET_KEY = process.env["RUSTFS_SECRET_KEY"] ?? readFileSync(process.env["RUSTFS_SECRET_KEY_FILE"]!, "utf-8").trim();
