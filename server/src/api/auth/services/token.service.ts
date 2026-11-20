import * as config from "@config";
import { PublicProtocol } from "paseto";
import {
	PublicKeyFromCryptoKey,
	SecretKeyFromCryptoKey,
	SignFactory,
	VerifyFactory,
	type PublicKey,
	type SecretKey,
} from "paseto/v4/public";
import { AuthErrors } from "../auth.errors";

// Helpers

const ED25519_PKCS8_PREFIX = "302e020100300506032b657004220420";
const ED25519_SPKI_PREFIX = "302a300506032b6570032100";
const paseto = new PublicProtocol(SignFactory, VerifyFactory);

let signingKeyPromise: Promise<SecretKey> | undefined;
let verificationKeyPromise: Promise<PublicKey> | undefined;

const signingKey = () => signingKeyPromise ??= (async () => {
	const key = config.AUTH_SECRET_SIGN_KEY;
	const seed = key.byteLength === 64 ? key.subarray(0, 32) : key;
	if (seed.byteLength !== 32) throw new Error("Invalid Ed25519 secret key length");

  const pkcs8 = Uint8Array.fromHex(ED25519_PKCS8_PREFIX + Buffer.from(seed).toString("hex"));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", pkcs8, "Ed25519", true, ["sign"]);

	return SecretKeyFromCryptoKey(cryptoKey);
})();

const verificationKey = () => verificationKeyPromise ??= (async () => {
	const key = config.AUTH_PUBLIC_SIGN_KEY;
	if (key.byteLength !== 32) throw new Error("Invalid Ed25519 public key length");

	const spki = Uint8Array.fromHex(ED25519_SPKI_PREFIX + Buffer.from(key).toString("hex"));
	const cryptoKey = await crypto.subtle.importKey("spki", spki, "Ed25519", false, ["verify"]);

	return PublicKeyFromCryptoKey(cryptoKey);
})();

// Interfaces

interface ClientSessionPayload {
	rawRefreshToken: Uint8Array,
	sessionId: string | bigint
}

export interface AccessTokenPayload {
	sessionId: string;
	sub: string;
}

// Tokens

/**
 * Generates a 5-minute v4.public PASETO with session and user identifiers.
 *
 * @param sessionId - session ID refresh token attached to.
 * @param userId - session's user ID.
 *
 * @returns access token.
 */
export async function generateAccessToken(sessionId: string|bigint, userId: string): Promise<string> {
  return paseto.Sign(await signingKey(), {
    sessionId: sessionId.toString(),
    sub: userId,
  }, {
    expiresIn: config.AuthAdjustments.ACCESS_TOKEN_AGE_SECONDS,
    now: new Date(Date.now()),
  });
}

/** 
 * Verifies the signature and expiration only, then returns the full payload.
 *
 * @param token - access token to validate.
 *
 * @returns session ID and user ID on success.
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
	let claims;

	try {
		({ claims } = await paseto.Verify(await verificationKey(), token, { now: new Date() }));
	} catch (e) {
		throw AuthErrors.error("auth-invalid-access-token").withDetails(e);
	}

	return claims as unknown as AccessTokenPayload;
}

/**
 * Session token is like refresh token, but with session ID prefix.
 * This function generates a session token in base64url (for cookies usage)
 * using refresh token and session ID raw values.
 *
 * @param clientSession - object containing refresh token and session ID.
 *
 * @returns session token.
 */
export function packSessionToken<T extends ClientSessionPayload>(clientSession: T): string {
	const tokenBytes = Buffer.allocUnsafe(8 + clientSession.rawRefreshToken.byteLength);
	tokenBytes.writeBigInt64BE(BigInt(clientSession.sessionId), 0);
	tokenBytes.set(clientSession.rawRefreshToken, 8);

	return tokenBytes.toBase64({ alphabet: "base64url", omitPadding: true });
}

/**
 * A reverse operation of {@link packSessionToken}. It extracts refresh token and
 * session ID from session token received from client's cookies.
 * 
 * @param clientSession - base64url session token.
 *
 * @returns session ID and refresh token.
 */
export function extractSessionToken(clientSession: string): ClientSessionPayload {
	let bytes: Uint8Array;

	try {
		bytes = Uint8Array.fromBase64(clientSession, { alphabet: "base64url" });
	} catch (e) {
		throw AuthErrors.error("auth-invalid-session-token").withDetails(e);
	}

	if (bytes.byteLength !== 8 + 32) { // 8 for sessionId, 32 for refreshToken
		throw AuthErrors.error("auth-invalid-session-token").withDetails(`byte length: ${bytes.byteLength}`);
	}

	const rawRefreshToken = bytes.subarray(8);
	const sessionId = new DataView(bytes.buffer, bytes.byteOffset, 8).getBigInt64(0, false);

	return { rawRefreshToken, sessionId };
}

/**
 * Hashes refresh token with a secret key to make it ready for storing in database.
 *
 * @param signKey - 64 bytes key to be used in HMAC-SHA512.
 * @param payload - HMAC hash payload.
 *
 * @returns database refresh token (hashed token)
 */
export function generateDBRefreshToken<T extends ClientSessionPayload & { userId: string }>(signKey: Uint8Array, payload: T): Uint8Array {
	const tokenBytes = Buffer.allocUnsafe(8 + 16 + payload.rawRefreshToken.byteLength);
	tokenBytes.writeBigInt64BE(BigInt(payload.sessionId), 0);
	tokenBytes.set(Uint8Array.fromHex(payload.userId.replaceAll("-", "")), 8);
	tokenBytes.set(payload.rawRefreshToken, 24);

	const hashedToken = new Bun.CryptoHasher("sha512", signKey)
		.update(tokenBytes)
		.digest("hex");

	return Uint8Array.fromHex(hashedToken);
}

/**
 * Generates a full set of tokens.
 *
 * @param signKey - 64 bytes key to be used in HMAC-SHA512.
 * @param payload - HMAC hash payload.
 *
 * @returns a full set of tokens to be saved in database and cookies.
 */
export function generateTokens<T extends {
	userId: string,
	sessionId: string | bigint
}>(signKey: Uint8Array, payload: T): {
	rawRefreshToken: Uint8Array,
	dbRefreshToken: Uint8Array,
	sessionToken: string
} {
	const rawRefreshToken = crypto.getRandomValues(new Uint8Array(32));
	const dbRefreshToken = generateDBRefreshToken(signKey, {
		sessionId: BigInt(payload.sessionId),
		userId: payload.userId,
		rawRefreshToken
	});
	const sessionToken = packSessionToken({
		sessionId: BigInt(payload.sessionId),
		rawRefreshToken
	});

	return { rawRefreshToken, dbRefreshToken, sessionToken };
}
