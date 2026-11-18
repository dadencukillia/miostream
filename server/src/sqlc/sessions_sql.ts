import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getSessionByIdQuery = `-- name: GetSessionById :one
SELECT
  session_id, user_id,
  refresh_token, expire_time, previous_refresh_token, rotated_at,
  device_type, device_name, os, browser, user_location, ip_address
FROM public.sessions
WHERE session_id = $1::BIGINT`;

export interface GetSessionByIdArgs {
    sessionId: string;
}

export interface GetSessionByIdRow {
    sessionId: string;
    userId: string;
    refreshToken: Buffer | null;
    expireTime: Date;
    previousRefreshToken: Buffer | null;
    rotatedAt: Date;
    deviceType: string | null;
    deviceName: string | null;
    os: string | null;
    browser: string | null;
    userLocation: string | null;
    ipAddress: string | null;
}

export async function getSessionById(client: Client, args: GetSessionByIdArgs): Promise<GetSessionByIdRow | null> {
    const result = await client.query({
        text: getSessionByIdQuery,
        values: [args.sessionId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        sessionId: row[0],
        userId: row[1],
        refreshToken: row[2],
        expireTime: row[3],
        previousRefreshToken: row[4],
        rotatedAt: row[5],
        deviceType: row[6],
        deviceName: row[7],
        os: row[8],
        browser: row[9],
        userLocation: row[10],
        ipAddress: row[11]
    };
}

export const createSessionQuery = `-- name: CreateSession :one
INSERT INTO public.sessions(
  user_id, refresh_token,
  device_type, device_name, os, browser, user_location, ip_address
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING
  session_id, user_id,
  refresh_token, expire_time, previous_refresh_token, rotated_at,
  device_type, device_name, os, browser, user_location, ip_address`;

export interface CreateSessionArgs {
    userId: string;
    refreshToken: Buffer | null;
    deviceType: string | null;
    deviceName: string | null;
    os: string | null;
    browser: string | null;
    userLocation: string | null;
    ipAddress: string | null;
}

export interface CreateSessionRow {
    sessionId: string;
    userId: string;
    refreshToken: Buffer | null;
    expireTime: Date;
    previousRefreshToken: Buffer | null;
    rotatedAt: Date;
    deviceType: string | null;
    deviceName: string | null;
    os: string | null;
    browser: string | null;
    userLocation: string | null;
    ipAddress: string | null;
}

export async function createSession(client: Client, args: CreateSessionArgs): Promise<CreateSessionRow | null> {
    const result = await client.query({
        text: createSessionQuery,
        values: [args.userId, args.refreshToken, args.deviceType, args.deviceName, args.os, args.browser, args.userLocation, args.ipAddress],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        sessionId: row[0],
        userId: row[1],
        refreshToken: row[2],
        expireTime: row[3],
        previousRefreshToken: row[4],
        rotatedAt: row[5],
        deviceType: row[6],
        deviceName: row[7],
        os: row[8],
        browser: row[9],
        userLocation: row[10],
        ipAddress: row[11]
    };
}

export const rotateRefreshTokenQuery = `-- name: RotateRefreshToken :one
UPDATE public.sessions
SET
  previous_refresh_token = refresh_token,
  refresh_token = $1,
  rotated_at = now() AT TIME ZONE 'UTC'
WHERE
  $2::NUMBER <= 0
  OR rotated_at + $2::NUMBER < (now() AT TIME ZONE 'UTC')
RETURNING
  session_id, user_id,
  refresh_token, expire_time, previous_refresh_token, rotated_at,
  device_type, device_name, os, browser, user_location, ip_address`;

export interface RotateRefreshTokenArgs {
    refreshToken: Buffer | null;
    rotationTime: string;
}

export interface RotateRefreshTokenRow {
    sessionId: string;
    userId: string;
    refreshToken: Buffer | null;
    expireTime: Date;
    previousRefreshToken: Buffer | null;
    rotatedAt: Date;
    deviceType: string | null;
    deviceName: string | null;
    os: string | null;
    browser: string | null;
    userLocation: string | null;
    ipAddress: string | null;
}

export async function rotateRefreshToken(client: Client, args: RotateRefreshTokenArgs): Promise<RotateRefreshTokenRow | null> {
    const result = await client.query({
        text: rotateRefreshTokenQuery,
        values: [args.refreshToken, args.rotationTime],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        sessionId: row[0],
        userId: row[1],
        refreshToken: row[2],
        expireTime: row[3],
        previousRefreshToken: row[4],
        rotatedAt: row[5],
        deviceType: row[6],
        deviceName: row[7],
        os: row[8],
        browser: row[9],
        userLocation: row[10],
        ipAddress: row[11]
    };
}

export const deleteExpiredSessionsQuery = `-- name: DeleteExpiredSessions :exec
DELETE FROM public.sessions
WHERE expire_time < (now() AT TIME ZONE 'UTC')`;

export async function deleteExpiredSessions(client: Client): Promise<void> {
    await client.query({
        text: deleteExpiredSessionsQuery,
        values: [],
        rowMode: "array"
    });
}

export const deleteSessionByIdQuery = `-- name: DeleteSessionById :one
DELETE FROM public.sessions
WHERE session_id = $1::BIGINT
RETURNING
  session_id, user_id,
  refresh_token, expire_time, previous_refresh_token, rotated_at,
  device_type, device_name, os, browser, user_location, ip_address`;

export interface DeleteSessionByIdArgs {
    sessionId: string;
}

export interface DeleteSessionByIdRow {
    sessionId: string;
    userId: string;
    refreshToken: Buffer | null;
    expireTime: Date;
    previousRefreshToken: Buffer | null;
    rotatedAt: Date;
    deviceType: string | null;
    deviceName: string | null;
    os: string | null;
    browser: string | null;
    userLocation: string | null;
    ipAddress: string | null;
}

export async function deleteSessionById(client: Client, args: DeleteSessionByIdArgs): Promise<DeleteSessionByIdRow | null> {
    const result = await client.query({
        text: deleteSessionByIdQuery,
        values: [args.sessionId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        sessionId: row[0],
        userId: row[1],
        refreshToken: row[2],
        expireTime: row[3],
        previousRefreshToken: row[4],
        rotatedAt: row[5],
        deviceType: row[6],
        deviceName: row[7],
        os: row[8],
        browser: row[9],
        userLocation: row[10],
        ipAddress: row[11]
    };
}

