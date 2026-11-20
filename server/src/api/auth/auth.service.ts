import type { IncomingHttpHeaders } from "node:http";
import * as config from "@config";
import { AuthErrors } from "./auth.errors";
import type { GoogleOAuthUserInfo } from "./auth.dto";
import { createSession, getSessionById, rotateRefreshToken } from "@sqlc/sessions_sql";
import * as userServices from "@/api/user/user.shared";
import { OAuthProvider, type OAuthConfig, providers } from "@utils/oauthProvider";
import { generateNickname } from "@utils/nickname";
import { UAParser } from "ua-parser-js";
import { Client, Pool } from "pg";
import { PublicProtocol } from "paseto";
import {
  PublicKeyFromCryptoKey,
  SecretKeyFromCryptoKey,
  SignFactory,
  VerifyFactory,
  type PublicKey,
  type SecretKey,
} from "paseto/v4/public";

// Helpers

const wrapDBError = async <T>(dbReq: Promise<T>): Promise<T> => {
  try {
    return await dbReq;
  } catch (e) {
    throw AuthErrors.error("auth-db-failed").withDetails(e);
  }
};

const unwrapDBNull = async <T>(dbReq: Promise<T | null>): Promise<T> => {
  const awaited = await dbReq;
  if (awaited == null) throw AuthErrors.error("auth-db-not-found");

  return awaited;
}

const unwrapDB = async <T>(dbReq: Promise<T | null>): Promise<T> => unwrapDBNull(wrapDBError(dbReq));

// Interfaces

interface ClientSessionPayload {
  rawRefreshToken: Uint8Array,
  sessionId: string | bigint
}

interface SessionEntry {
  rawRefreshToken: Uint8Array,
  dbRefreshToken: Uint8Array,
  sessionToken: string,
  sessionId: bigint,
  userId: string,
}

interface SessionRotationResult {
  rotated: boolean,
  newRawRefreshToken?: Uint8Array,
  dbRefreshToken: Uint8Array,
  newSessionToken?: string,
  sessionId: bigint,
  userId: string,
}

export interface SignMetadata {
  deviceType?: string,
  deviceName?: string,
  os?: string,
  browser?: string,
  userLocation?: string,
  ipAddress?: string
}

// OAuth Providers

const NICKNAME_GENERATION_RETRIES = 3;

const oauthProviders: Record<string, { provider: OAuthProvider; config: OAuthConfig }> = {
  google: {
    provider: providers.google,
    config: {
      clientId: config.OAUTH_CLIENT_ID,
      clientSecret: config.OAUTH_CLIENT_SECRET,
      redirectUri: config.OAUTH_REDIRECT_URI,
      stateSecret: config.OAUTH_STATE_HMAC_SECRET,
      scopes: ["openid", "email", "profile"],
    },
  },
};

function getOAuthProviderEntry(slug: string) {
  const entry = oauthProviders[slug];
  if (!entry) throw AuthErrors.error("oauth-unsupported-provider").withDetails(slug);
  return entry;
}

const sanitizeFullName = (rawName?: string): string => {
  const cleaned = (rawName ?? "")
    .replace(/[^\p{L} '\u2019\u02BC.-]/gu, "")
    .replace(/^[^\p{L}]+|[^\p{L}.]+$/gu, "")
    .trim()
    .slice(0, 100);

  return cleaned.length >= 2 ? cleaned : "User";
};

export function createOAuthAuthorization(providerSlug: string) {
  const entry = getOAuthProviderEntry(providerSlug);
  return entry.provider.getAuthorizationUrl(entry.config);
}

export async function authenticateOAuthCallback(
  client: Pool,
  state: string,
  nonce: string,
  code: string
): Promise<{ userId: string }> {
  const stateVerification = OAuthProvider.verifyState(state, nonce, {
    stateSecret: config.OAUTH_STATE_HMAC_SECRET,
  });
  if (!stateVerification.valid || !stateVerification.provider) {
    throw AuthErrors.error("oauth-invalid-state");
  }

  const entry = getOAuthProviderEntry(stateVerification.provider);

  let profile: GoogleOAuthUserInfo;
  try {
    const providerToken = await entry.provider.exchangeCodeForToken(code, entry.config);
    profile = await entry.provider.getUserInfo<GoogleOAuthUserInfo>(providerToken);
  } catch (e) {
    throw AuthErrors.error("oauth-missing-code").withDetails(e);
  }

  if (!profile.sub || !profile.email || !profile.email_verified) {
    throw AuthErrors.error("oauth-invalid-state").withDetails("unverified or incomplete provider profile");
  }

  let user;

  user = await userServices.getUserByGoogleId(client, profile.sub).catch((e: any) => {
    if (e?.slug === "user-not-found") return null;
    throw e;
  });

  if (!user) {
    for (let attempt = 0; attempt < NICKNAME_GENERATION_RETRIES; attempt++) {
      try {
        user = await userServices.createUser(client, {
          googleId: profile.sub,
          email: profile.email,
          nickname: generateNickname(),
          fullName: sanitizeFullName(profile.name),
        });
        break;
      } catch (e: any) {
        if (e?.slug !== "user-nickname-already-taken" || attempt === NICKNAME_GENERATION_RETRIES - 1) {
          throw e;
        }
      }
    }
  }

  if (!user || user.userStatus !== "active") {
    throw AuthErrors.error("auth-no-session-access");
  }

  return { userId: user.userId };
}

export function parseClientMetadata(headers: IncomingHttpHeaders, ipAddress?: string): SignMetadata {
  const parser = new UAParser(headers["user-agent"]);
  const { browser, os, device } = parser.getResult();

  const chModelHeader = headers["sec-ch-ua-model"];
  const chModel = typeof chModelHeader === "string"
    ? chModelHeader.replace(/^"|"$/g, "").trim()
    : undefined;

  const deviceModel = chModel || device.model;
  const deviceName = [device.vendor, deviceModel].filter(Boolean).join(" ") || undefined;
  const deviceType = device.type ?? (os.name || browser.name ? "desktop" : undefined);
  const osName = [os.name, os.version].filter(Boolean).join(" ") || undefined;
  const majorVersion = browser.version?.split(".")[0];
  const browserName = [browser.name, majorVersion].filter(Boolean).join(" ") || undefined;

  return {
    deviceType,
    deviceName,
    os: osName,
    browser: browserName,
    ipAddress: ipAddress || undefined,
  };
}

// Crypto

const ACCESS_TOKEN_TTL_SECONDS = 5 * 60;
const ED25519_PKCS8_PREFIX = "302e020100300506032b657004220420";
const ED25519_SPKI_PREFIX = "302a300506032b6570032100";
const paseto = new PublicProtocol(SignFactory, VerifyFactory);

export interface AccessTokenPayload {
  sessionId: string;
  sub: string;
}

let signingKeyPromise: Promise<SecretKey> | undefined;
let verificationKeyPromise: Promise<PublicKey> | undefined;

const signingKey = () => signingKeyPromise ??= (async () => {
  const key = config.AUTH_SECRET_SIGN_KEY;
  const seed = key.byteLength === 64 ? key.subarray(0, 32) : key;
  if (seed.byteLength !== 32) throw new Error("Invalid Ed25519 secret key length");

  const pkcs8 = Uint8Array.fromHex(ED25519_PKCS8_PREFIX + Buffer.from(seed).toString("hex"));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", pkcs8, "Ed25519", false, ["sign"]);

  return SecretKeyFromCryptoKey(cryptoKey);
})();

const verificationKey = () => verificationKeyPromise ??= (async () => {
  const key = config.AUTH_PUBLIC_SIGN_KEY;
  if (key.byteLength !== 32) throw new Error("Invalid Ed25519 public key length");

  const spki = Uint8Array.fromHex(ED25519_SPKI_PREFIX + Buffer.from(key).toString("hex"));
  const cryptoKey = await crypto.subtle.importKey("spki", spki, "Ed25519", false, ["verify"]);

  return PublicKeyFromCryptoKey(cryptoKey);
})();

/** Generates a 5-minute v4.public PASETO with session and user identifiers. */
export async function generateAccessToken(sessionId: string | bigint, userId: string): Promise<string> {
  return paseto.Sign(await signingKey(), {
    sessionId: sessionId.toString(),
    sub: userId,
  }, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    now: new Date(Date.now()),
  });
}

/** Verifies the signature and expiration only, then returns the full payload. */
export async function validateAccessToken(token: string): Promise<AccessTokenPayload> {
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

// Sessions

export async function newUserSessionClient(
  client: Client,
  userId: string,
  signMetadata: SignMetadata = {}
) {
  const metadata: { [Key in keyof SignMetadata]-?: SignMetadata[Key] | null } = {
    deviceType: signMetadata.deviceType ?? null,
    deviceName: signMetadata.deviceName ?? null,
    os: signMetadata.os ?? null,
    browser: signMetadata.browser ?? null,
    userLocation: signMetadata.userLocation ?? null,
    ipAddress: signMetadata.ipAddress ?? null
  };

  // Create session entry and receive session ID

  const createdSession = await unwrapDB(createSession(client, {
    userId, refreshToken: null,
    ...metadata
  }));

  // Generate refresh token using session ID

  const tokens = generateTokens(config.SESSION_HMAC_SECRET, {
    userId, sessionId: createdSession.sessionId
  });

  // Update refresh token in session entry

  const actualSession = await unwrapDB(rotateRefreshToken(client, {
    refreshToken: Buffer.from(tokens.dbRefreshToken),
    rotationTime: "-1",
    sessionId: createdSession.sessionId
  }));

  if (!actualSession.refreshToken) throw AuthErrors.error("auth-db-failed");

  return {
    rawRefreshToken: tokens.rawRefreshToken,
    dbRefreshToken: tokens.dbRefreshToken,
    sessionId: BigInt(actualSession.sessionId),
    userId: userId,
    sessionToken: tokens.sessionToken
  };
}

/**
 * Creates a new session for user in database.
 *
 * @param client - database pool connection instance.
 * @param userId - a user session will be created for.
 * @param [signMetadata={}] - additional sign information.
 *
 * @returns tokens, session ID and user ID.
 */
export async function newUserSession(
  client: Pool,
  userId: string,
  signMetadata: SignMetadata = {}
): Promise<SessionEntry> {
  const con = await client.connect();

  try {
    await wrapDBError(con.query("BEGIN;"));
    const resp = await newUserSessionClient(con, userId, signMetadata);
    await wrapDBError(con.query("COMMIT;"));

    return resp;
  } catch (e) {
    await con.query("ROLLBACK;").catch(_ => { });
    throw e;
  } finally {
    con.release();
  }
}

/**
 * Validates a session and rotate refresh token if needed.
 *
 * @param client - database pool connection instance.
 * @param sessionToken - a session token received from user's cookies.
 * @param [opts={}] - token rotation adjustments.
 *
 * @returns new tokens (if rotated), session ID and user ID.
 */
export async function useRefreshToken(
  client: Pool | Client,
  sessionToken: string,
  opts: {
    previousTokenWindowMillis?: number,
    tokenRotationMillis?: number
  } = {}
): Promise<SessionRotationResult> {
  const sessionPayload = extractSessionToken(sessionToken);
  const previousTokenWindowMillis = opts.previousTokenWindowMillis ?? 180_000;
  const tokenRotationMillis = opts.tokenRotationMillis ?? 180_000;
  const utcTimestamp = Date.now();

  // Get session

  let session = await unwrapDB(getSessionById(client, {
    sessionId: sessionPayload.sessionId.toString()
  }));

  // Verify session

  if (!session.refreshToken || session.expireTime.getTime() <= utcTimestamp) throw AuthErrors.error("auth-no-session-access");
  const fullInfo = { ...session, ...sessionPayload };

  const dbRefreshToken = generateDBRefreshToken(config.SESSION_HMAC_SECRET, fullInfo);

  if (
    !(session.refreshToken?.length === dbRefreshToken.length && crypto.timingSafeEqual(session.refreshToken, dbRefreshToken)) &&
    !(
      session.rotatedAt.getTime() + previousTokenWindowMillis > utcTimestamp &&
      session.previousRefreshToken?.length === dbRefreshToken.length && crypto.timingSafeEqual(session.previousRefreshToken, dbRefreshToken)
    )
  ) {
    throw AuthErrors.error("auth-no-session-access");
  }

  // Check rotation and fulfil

  if (session.rotatedAt.getTime() + tokenRotationMillis <= utcTimestamp) {
    const tokens = generateTokens(config.SESSION_HMAC_SECRET, fullInfo);
    const updatedSession = await wrapDBError(rotateRefreshToken(client, {
      sessionId: fullInfo.sessionId.toString(),
      refreshToken: Buffer.from(tokens.dbRefreshToken),
      rotationTime: tokenRotationMillis.toString(),
    }));

    if (updatedSession && updatedSession.refreshToken) {
      return {
        rotated: true,
        newRawRefreshToken: tokens.rawRefreshToken,
        dbRefreshToken: updatedSession.refreshToken,
        newSessionToken: tokens.sessionToken,
        sessionId: BigInt(fullInfo.sessionId),
        userId: fullInfo.userId
      };
    }
  }


  return {
    rotated: false,
    dbRefreshToken: session.refreshToken,
    sessionId: BigInt(fullInfo.sessionId),
    userId: fullInfo.userId,
  };
}
