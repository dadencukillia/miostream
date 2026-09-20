import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { AUTH_COOKIE_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from "../config/config";
import { mockPrisma } from "../prisma/mock";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

function secretKey() {
	if (!AUTH_COOKIE_SECRET) throw new Error("AUTH_COOKIE_SECRET is required");
	return createHash("sha256").update(AUTH_COOKIE_SECRET).digest();
}

export function googleLoginUrl(state: string) {
	const params = new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI, response_type: "code", scope: "openid email profile", access_type: "offline", prompt: "consent", state });
	return `${GOOGLE_AUTH_URL}?${params}`;
}

export function encryptRefreshToken(token: string) {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
	const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
	return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export async function exchangeGoogleCode(code: string) {
	const response = await fetch(GOOGLE_TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, redirect_uri: GOOGLE_REDIRECT_URI, grant_type: "authorization_code" }) });
	if (!response.ok) throw new Error(`Google token exchange failed: ${response.status}`);
	const tokens = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
	if (!tokens.access_token) throw new Error("Google did not return an access token");
	const profileResponse = await fetch(GOOGLE_USERINFO_URL, { headers: { authorization: `Bearer ${tokens.access_token}` } });
	if (!profileResponse.ok) throw new Error(`Google profile request failed: ${profileResponse.status}`);
	const profile = await profileResponse.json() as { email?: string; name?: string };
	if (!profile.email) throw new Error("Google profile has no email");
	return { ...profile, refreshToken: tokens.refresh_token, expiresIn: tokens.expires_in ?? 3600 };
}

export async function createSession(profile: { email: string; name?: string; refreshToken?: string; expiresIn: number }) {
	const user = await mockPrisma.user.upsert({ conflictOn: { email: profile.email }, create: { email: profile.email, name: profile.name ?? null }, update: { name: profile.name ?? null } });
	const sessionId = randomBytes(32).toString("base64url");
	await mockPrisma.authSession.create({ id: sessionId, userId: user.id, refreshToken: encryptRefreshToken(profile.refreshToken ?? ""), expiresAt: new Date(Date.now() + profile.expiresIn * 1000).toISOString() });
	return { sessionId, user };
}

export async function getSession(sessionId: string) {
	return mockPrisma.authSession.where({ id: sessionId }).first();
}
