import { readFileSync } from "node:fs";

// Services host
export const POSTGRES_HOST = process.env['POSTGRES_HOST']!;
export const REDIS_HOST = process.env['REDIS_HOST']!;
export const RUSTFS_HOST = process.env['RUSTFS_HOST']!;

export const DB_NAME = "miostream";
export const DB_PASS = process.env["DB_PASS"] ?? await Bun.file(process.env["DB_PASS_FILE"]!).text();
export const DB_URL = `postgresql://postgres:${DB_PASS}@${POSTGRES_HOST}/${DB_NAME}`;

// Authentification
export const AUTH_COOKIE_NAME = process.env["AUTH_COOKIE_NAME"] ?? "auth_token";
export const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"] ?? "";
export const GOOGLE_CLIENT_SECRET = process.env["GOOGLE_CLIENT_SECRET"] ?? readFileSync(process.env["GOOGLE_CLIENT_SECRET_FILE"]!, "utf-8").trim();
export const GOOGLE_REDIRECT_URI = process.env["GOOGLE_REDIRECT_URI"] ?? "https://localhost/api/auth/google/callback";
export const AUTH_JWT_SECRET = process.env["AUTH_JWT_SECRET"] ?? readFileSync(process.env["AUTH_JWT_SECRET_FILE"]!, "utf-8").trim();
