import { readFileSync } from "node:fs";

function readSecret(name: string, fileName: string, fallback: string) {
	const value = process.env[name];
	if (value) return value;

	const path = process.env[fileName];
	return path ? readFileSync(path, "utf-8").trim() : fallback;
}

// Services host
export const POSTGRES_HOST = process.env['POSTGRES_HOST'] ?? "localhost:5432";
export const REDIS_HOST = process.env['REDIS_HOST'] ?? "localhost:6379";
export const RUSTFS_HOST = process.env['RUSTFS_HOST'] ?? "localhost:9000";

// Secrets
export const DB_NAME = "miostream";
export const DB_PASS = readSecret("DB_PASS", "DB_PASS_FILE", "");
export const DB_URL = `postgresql://postgres:${DB_PASS}@${POSTGRES_HOST}/${DB_NAME}`;
export const RUSTFS_ACCESS_KEY = readSecret("RUSTFS_ACCESS_KEY", "RUSTFS_ACCESS_KEY_FILE", "");
export const RUSTFS_SECRET_KEY = readSecret("RUSTFS_SECRET_KEY", "RUSTFS_SECRET_KEY_FILE", "");

// Authentification
export const AUTH_COOKIE_NAME = process.env["AUTH_COOKIE_NAME"] ?? "auth_token";
export const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"] ?? "";
export const GOOGLE_CLIENT_SECRET = readSecret("GOOGLE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET_FILE", "");
export const GOOGLE_REDIRECT_URI = process.env["GOOGLE_REDIRECT_URI"] ?? "https://localhost/api/auth/google/callback";
export const AUTH_JWT_SECRET = readSecret("AUTH_JWT_SECRET", "AUTH_JWT_SECRET_FILE", "local-development-secret");