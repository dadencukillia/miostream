import { readFileSync } from "node:fs";

// Helpers

function readSecret(name: string, fileName: string, fallback: string) {
	const value = process.env[name];
	if (value) return value;

	const path = process.env[fileName];
	return path ? readFileSync(path, "utf-8").trim() : fallback;
}

function require(value: null | undefined | string): string {
	if (!value || value === "") throw Error("Env var is required!");
	return value;
}

// Constants

export const APP_NAME = "miostream";
export const MIGRATIONS_DIRECTORY = "./db/migrations";
export const DB_NAME = "miostream";

// Services host

export const SITE_ADDRESS = process.env.SITE_ADDRESS ?? "localhost";
export const POSTGRES_HOST = process.env.POSTGRES_HOST ?? "localhost:5432";
export const REDIS_HOST = process.env.REDIS_HOST ?? "localhost:6379";
export const RUSTFS_HOST = process.env.RUSTFS_HOST ?? "localhost:9000";

// Secrets

export const DB_PASS = readSecret("DB_PASS", "DB_PASS_FILE", "");
export const DB_URL = `postgresql://postgres:${DB_PASS}@${POSTGRES_HOST}/${DB_NAME}`;
export const RUSTFS_ACCESS_KEY = readSecret("RUSTFS_ACCESS_KEY", "RUSTFS_ACCESS_KEY_FILE", "");
export const RUSTFS_SECRET_KEY = readSecret("RUSTFS_SECRET_KEY", "RUSTFS_SECRET_KEY_FILE", "");

// Authentication

export const AUTH_PUBLIC_SIGN_KEY = Uint8Array.fromBase64(require(process.env.AUTH_PUBLIC_SIGN_KEY));
export const AUTH_SECRET_SIGN_KEY = Uint8Array.fromBase64(require(readSecret("AUTH_SECRET_SIGN_KEY", "AUTH_SECRET_SIGN_KEY_FILE", "")));
export const SESSION_HMAC_SECRET = Uint8Array.fromHex(require(readSecret("SESSION_HMAC_SECRET", "SESSION_HMAC_SECRET_FILE", "")));
export const OAUTH_STATE_HMAC_SECRET = Uint8Array.fromHex(require(readSecret("OAUTH_STATE_HMAC_SECRET", "OAUTH_STATE_HMAC_SECRET_FILE", "")));
export const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID ?? "myclientid";
export const OAUTH_CLIENT_SECRET = readSecret("OAUTH_CLIENT_SECRET", "OAUTH_CLIENT_SECRET_FILE", "myclientsecret");

export const AuthAdjustments = {
  SUCCESS_REDIRECT_URL: "/",

	OAUTH_NONCE_COOKIE_NAME: "oauth_nonce",
	OAUTH_NONCE_COOKIE_PATH: "/",
	OAUTH_NONCE_MAX_AGE_SECONDS: 10 * 60,

  ACCESS_TOKEN_AGE_SECONDS: 5 * 60,

	SESSION_COOKIE_NAME: "session_token",
	SESSION_COOKIE_PATH: "/api/auth/accessToken",
	SESSION_MAX_AGE_SECONDS: 180 * 24 * 60 * 60,
}
