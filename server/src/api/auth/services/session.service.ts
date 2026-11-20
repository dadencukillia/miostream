import * as config from "@config";
import { AuthErrors } from "../auth.errors";
import { createSession, getSessionById, rotateRefreshToken } from "@sqlc/sessions_sql";
import { Client, Pool } from "pg";
import { extractSessionToken, generateDBRefreshToken, generateTokens } from "./token.service";

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
    rotationTime: -1,
    sessionId: createdSession.sessionId,
    oldRefreshToken: null
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

  if (tokenRotationMillis >= 0 && session.rotatedAt.getTime() + tokenRotationMillis <= utcTimestamp) {
    const tokens = generateTokens(config.SESSION_HMAC_SECRET, fullInfo);
    const updatedSession = await wrapDBError(rotateRefreshToken(client, {
      sessionId: fullInfo.sessionId.toString(),
      refreshToken: Buffer.from(tokens.dbRefreshToken),
      rotationTime: tokenRotationMillis,
      oldRefreshToken: session.refreshToken
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
