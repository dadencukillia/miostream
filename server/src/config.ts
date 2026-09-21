import { readFileSync } from "node:fs";

function readSecret(name: string, fileName: string, fallback: string) {
	const value = process.env[name];
	if (value) return value;

	const path = process.env[fileName];
	return path ? readFileSync(path, "utf-8").trim() : fallback;
}

// Services host
export const POSTGRES_HOST = process.env['POSTGRES_HOST']!;
export const REDIS_HOST = process.env['REDIS_HOST']!;
export const RUSTFS_HOST = process.env['RUSTFS_HOST']!;

export const DB_NAME = "miostream";
export const DB_PASS = readSecret("DB_PASS", "DB_PASS_FILE", "");
export const DB_URL = `postgresql://postgres:${DB_PASS}@${POSTGRES_HOST}/${DB_NAME}`;

// Authentification
export const AUTH_COOKIE_NAME = process.env["AUTH_COOKIE_NAME"] ?? "auth_token";
export const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"] ?? "";
export const GOOGLE_CLIENT_SECRET = readSecret("GOOGLE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET_FILE", "");
export const GOOGLE_REDIRECT_URI = process.env["GOOGLE_REDIRECT_URI"] ?? "https://localhost/api/auth/google/callback";
export const AUTH_JWT_SECRET = readSecret("AUTH_JWT_SECRET", "AUTH_JWT_SECRET_FILE", "local-development-secret");
