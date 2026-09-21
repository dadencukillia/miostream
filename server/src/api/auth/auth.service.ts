import { createCipheriv, createHash, randomBytes } from "node:crypto";
import * as config from "../../config";
import { mockPrisma } from "./prisma/mock";
import jwt from "jsonwebtoken";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

function secretKey() {
	if (!config.AUTH_JWT_SECRET) throw new Error("AUTH_JWT_SECRET is required");
	return config.AUTH_JWT_SECRET;
}

function encryptRefreshToken(token: string) {
	const iv = randomBytes(12);
	const key = createHash("sha256").update(secretKey()).digest();
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
	return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function googleLoginUrl(state: string) {
	const params = new URLSearchParams({ client_id: config.GOOGLE_CLIENT_ID, redirect_uri: config.GOOGLE_REDIRECT_URI, response_type: "code", scope: "openid email profile", access_type: "offline", prompt: "consent", state });
	return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeGoogleCode(code: string) {
	const response = await fetch(GOOGLE_TOKEN_URL, 
		{ method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ code, client_id: config.GOOGLE_CLIENT_ID,
			client_secret: config.GOOGLE_CLIENT_SECRET,
			redirect_uri: config.GOOGLE_REDIRECT_URI,
			grant_type: "authorization_code" }) });

	if (!response.ok) throw new Error(`Google token exchange failed: ${response.status}`);
	const tokens = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number };

	if (!tokens.access_token) throw new Error("Google did not return an access token");
	const profileResponse = await fetch(GOOGLE_USERINFO_URL, { headers: { authorization: `Bearer ${tokens.access_token}` } });

	if (!profileResponse.ok) throw new Error(`Google profile request failed: ${profileResponse.status}`);

	const profile = await profileResponse.json() as { email?: string; name?: string };

	if (!profile.email) throw new Error("Google profile has no email");
	return { ...profile, refreshToken: tokens.refresh_token, expiresIn: tokens.expires_in ?? 3600 };
}

export async function handleGoogleUser(profile: { email: string; name?: string; refreshToken?: string }) {
	const user = await mockPrisma.user.upsert({
		 conflictOn: { email: profile.email },
		 create: { email: profile.email, name: profile.name ?? null },
		 update: { name: profile.name ?? null }
		});

	if (profile.refreshToken) {
		await mockPrisma.googleRefreshToken.upsert({
			userId: user.id,
			encryptedToken: encryptRefreshToken(profile.refreshToken),
		});
	}

	const token = jwt.sign({ userId: user.id }, secretKey(), { expiresIn: "30d" });

	return { token, user};
}
export function verifyAuthToken(token: string): { userId: number } | null {
	try {
		const claims = jwt.verify(token, secretKey());
		if (typeof claims === "string" || typeof claims.userId !== "number") return null;
		return { userId: claims.userId };
	} catch {
		return null;
	}
}
