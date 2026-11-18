import * as config from "@config";
import { AuthErrors } from "./auth.errors";
import { createSession, getSessionById, rotateRefreshToken, RotateRefreshTokenRow } from "@sqlc/sessions_sql";
import { Pool } from "pg";

interface ClientSession {
  rawRefreshToken: Uint8Array,
  sessionId: bigint
}

/**
  * Session token is like refresh token, but with session ID prefix.
  * This method generates a session token in base64url (for cookies usage)
  * using refresh token and session ID raw values.
  *
  * @param clientSession - object containing refresh token and session ID.
  *
  * @returns session token.
  */
export function extractSessionToken(clientSession: string): ClientSession {
  let bytes: Uint8Array;

  try {
    bytes = Uint8Array.fromBase64(clientSession, { alphabet: "base64url" });
  } catch(e) {
    throw AuthErrors.error("auth-invalid-session-token").withDetails(e);
  }

  if (bytes.byteLength !== 8 + 32) { // 8 for sessionId, 32 for refreshToken
    throw AuthErrors.error("auth-invalid-session-token").withDetails(`byte length: ${bytes.byteLength}`);
  }

  const rawRefreshToken = bytes.subarray(8);
  const sessionId = new DataView(bytes.buffer, bytes.byteOffset, 8).getBigInt64(0, false);

  return { rawRefreshToken, sessionId };
}

export function packSessionToken(clientSession: ClientSession): string {
  const tokenBytes = Buffer.allocUnsafe(8 + clientSession.rawRefreshToken.byteLength);
  tokenBytes.writeBigInt64BE(clientSession.sessionId, 0);
  tokenBytes.set(clientSession.rawRefreshToken, 8);

  return tokenBytes.toBase64({ alphabet: "base64url", omitPadding: true });
}

export function generateDBRefreshToken(signKey: Uint8Array, payload: ClientSession & { userId: string }): Uint8Array {
  const tokenBytes = Buffer.allocUnsafe(8 + 16 + payload.rawRefreshToken.byteLength);
  tokenBytes.writeBigInt64BE(payload.sessionId, 0);
  tokenBytes.set(Uint8Array.fromHex(payload.userId.replaceAll("-", "")), 8);
  tokenBytes.set(payload.rawRefreshToken, 24);

  const hashedToken = new Bun.CryptoHasher("sha512", signKey)
    .update(tokenBytes)
    .digest("hex");

  return Uint8Array.fromHex(hashedToken);
}

export async function newUserSession(
  client: Pool,
  userId: string,
  signMetadata: {
    deviceType?: string,
    deviceName?: string,
    os?: string,
    browser?: string,
    userLocation?: string,
    ipAddress?: string
  }
): Promise<{
  rawRefreshToken: Uint8Array,
  dbRefreshToken: Uint8Array,
  sessionToken: string,
  sessionId: BigInt,
  userId: string,
}> {
  const rawRefreshToken = crypto.getRandomValues(new Uint8Array(32));
  const metadata = {
    deviceType: signMetadata.deviceType ?? null,
    deviceName: signMetadata.deviceName ?? null,
    os: signMetadata.os ?? null,
    browser: signMetadata.browser ?? null,
    userLocation: signMetadata.userLocation ?? null,
    ipAddress: signMetadata.ipAddress ?? null,
  };

  const con = await client.connect();
  let actualSession: RotateRefreshTokenRow|null;

  try {
    await con.query("BEGIN;");

    const createdSession = await createSession(client, {
      userId, refreshToken: null,
      ...metadata
    });

    if (!createdSession) throw AuthErrors.error("auth-db-error");

    const sessionId = BigInt(createdSession.sessionId);
    const dbRefreshToken = generateDBRefreshToken(Uint8Array.fromHex(config.SESSION_HMAC_SECRET), {
      sessionId, userId, rawRefreshToken: rawRefreshToken
    });

    actualSession = await rotateRefreshToken(con, {
      refreshToken: new Buffer(dbRefreshToken),
      rotationTime: "-1",
      sessionId: createdSession.sessionId
    });

    if (!actualSession || !actualSession.refreshToken) throw AuthErrors.error("auth-db-error");

    await con.query("COMMIT;");
  } catch(e) {
    throw e;
  } finally {
    await con.query("ROLLBACK;").catch(_ => {});
    con.release();
  }

  const sessionToken = packSessionToken({
    sessionId: BigInt(actualSession.sessionId),
    rawRefreshToken
  });

  return {
    rawRefreshToken,
    dbRefreshToken: new Uint8Array(actualSession.refreshToken),
    sessionId: BigInt(actualSession.sessionId),
    userId: actualSession.userId,
    sessionToken: sessionToken
  };
}

export async function useRefreshToken(
  client: Pool,
  clientSessionToken: string,
  opts?: {
    previousTokenWindowMillis: number,
    tokenRotationMillis: number
  }
): Promise<{
  rotated: boolean,
  newRawRefreshToken?: Uint8Array,
  dbRefreshToken: Uint8Array,
  newSessionToken?: string,
  sessionId: BigInt,
  userId: string,
}> {
  const { sessionId, rawRefreshToken } = extractSessionToken(clientSessionToken);
  const previousTokenWindowMillis = opts?.previousTokenWindowMillis ?? 60_000;
  const tokenRotationMillis = opts?.tokenRotationMillis ?? 180_000;
  const utcTimestamp = Date.now();

  let session = await getSessionById(client, {
    sessionId: sessionId.toString()
  });

  if (!session || session.expireTime.getTime() <= utcTimestamp) throw AuthErrors.error("auth-no-session-access");

  const userId = session.userId;
  const dbRefreshToken = generateDBRefreshToken(Uint8Array.fromHex(config.SESSION_HMAC_SECRET), {
    userId, sessionId, rawRefreshToken
  });

  if (
    !(session.refreshToken?.length === dbRefreshToken.length && crypto.timingSafeEqual(session.refreshToken, dbRefreshToken)) &&
    !(
      session.rotatedAt.getTime() + previousTokenWindowMillis > utcTimestamp && 
      session.previousRefreshToken?.length === dbRefreshToken.length && crypto.timingSafeEqual(session.previousRefreshToken, dbRefreshToken)
    )
  ) {
    throw AuthErrors.error("auth-no-session-access");
  }

  let rotated = false;
  let newRawRefreshToken: undefined|Uint8Array;
  let newSessionToken: undefined|string;

  if (session.rotatedAt.getTime() + tokenRotationMillis <= utcTimestamp) {
    newRawRefreshToken = crypto.getRandomValues(new Uint8Array(32));
    newSessionToken = packSessionToken({ sessionId: sessionId, rawRefreshToken });
    const dbRefreshToken = generateDBRefreshToken(Uint8Array.fromHex(config.SESSION_HMAC_SECRET), {
      userId, sessionId, rawRefreshToken
    });

    const updatedSession = await rotateRefreshToken(client, {
      refreshToken: new Buffer(dbRefreshToken),
      rotationTime: tokenRotationMillis.toString(),
      sessionId: sessionId.toString()
    });

    if (updatedSession) {
      rotated = true;
      session = updatedSession;
    }
  }

  if (!session.refreshToken) throw AuthErrors.error("auth-no-session-access");

  return {
    rotated,
    newRawRefreshToken,
    dbRefreshToken: session.refreshToken,
    newSessionToken,
    sessionId,
    userId: session.userId,
  };
}
