import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const deleteUserByIdQuery = `-- name: DeleteUserById :one
DELETE FROM public.users
WHERE "id" = $1::uuid
RETURNING user_id, nickname, full_name, email, google_id, bio, password_hash, avatar_url, max_streak, timezone, streak_start_date, last_watch_date, profile_frame_url, profile_background_url, user_role, user_status, created_at, updated_at`;

export interface DeleteUserByIdArgs {
    userId: string;
}

export interface DeleteUserByIdRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    googleId: string | null;
    bio: string;
    passwordHash: string | null;
    avatarUrl: string;
    maxStreak: number;
    timezone: string;
    streakStartDate: Date | null;
    lastWatchDate: Date | null;
    profileFrameUrl: string | null;
    profileBackgroundUrl: string | null;
    userRole: string;
    userStatus: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function deleteUserById(client: Client, args: DeleteUserByIdArgs): Promise<DeleteUserByIdRow | null> {
    const result = await client.query({
        text: deleteUserByIdQuery,
        values: [args.userId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userId: row[0],
        nickname: row[1],
        fullName: row[2],
        email: row[3],
        googleId: row[4],
        bio: row[5],
        passwordHash: row[6],
        avatarUrl: row[7],
        maxStreak: row[8],
        timezone: row[9],
        streakStartDate: row[10],
        lastWatchDate: row[11],
        profileFrameUrl: row[12],
        profileBackgroundUrl: row[13],
        userRole: row[14],
        userStatus: row[15],
        createdAt: row[16],
        updatedAt: row[17]
    };
}

export const insertNewUserQuery = `-- name: InsertNewUser :one
INSERT INTO public.users (
    "nickname",
    "full_name",
    "email",
    "password_hash"
) VALUES (
    $1, $2, $3, $4
)
RETURNING user_id, nickname, full_name, email, google_id, bio, password_hash, avatar_url, max_streak, timezone, streak_start_date, last_watch_date, profile_frame_url, profile_background_url, user_role, user_status, created_at, updated_at`;

export interface InsertNewUserArgs {
    nickname: string;
    fullName: string;
    email: string;
    passwordHash: string | null;
}

export interface InsertNewUserRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    googleId: string | null;
    bio: string;
    passwordHash: string | null;
    avatarUrl: string;
    maxStreak: number;
    timezone: string;
    streakStartDate: Date | null;
    lastWatchDate: Date | null;
    profileFrameUrl: string | null;
    profileBackgroundUrl: string | null;
    userRole: string;
    userStatus: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function insertNewUser(client: Client, args: InsertNewUserArgs): Promise<InsertNewUserRow | null> {
    const result = await client.query({
        text: insertNewUserQuery,
        values: [args.nickname, args.fullName, args.email, args.passwordHash],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userId: row[0],
        nickname: row[1],
        fullName: row[2],
        email: row[3],
        googleId: row[4],
        bio: row[5],
        passwordHash: row[6],
        avatarUrl: row[7],
        maxStreak: row[8],
        timezone: row[9],
        streakStartDate: row[10],
        lastWatchDate: row[11],
        profileFrameUrl: row[12],
        profileBackgroundUrl: row[13],
        userRole: row[14],
        userStatus: row[15],
        createdAt: row[16],
        updatedAt: row[17]
    };
}

export const patchUserByIdQuery = `-- name: PatchUserById :one
UPDATE public.users
SET 
    -- Update only if key exists and is not null
    "nickname"          = COALESCE(($1::jsonb)->>'nickname', "nickname"),
    "full_name"         = COALESCE(($1::jsonb)->>'full_name', "full_name"),
    "email"             = COALESCE(($1::jsonb)->>'email', "email"),
    "timezone"          = COALESCE(($1::jsonb)->>'timezone', "timezone"),
    
    -- Update only if key exists in the object (allows setting to NULL)
    "bio"               = CASE WHEN ($1::jsonb) ? 'bio' THEN ($1::jsonb)->>'bio' ELSE "bio" END,
    "avatar_url"        = CASE WHEN ($1::jsonb) ? 'avatar_url' THEN ($1::jsonb)->>'avatar_url' ELSE "avatar_url" END,
    "social_networks" = CASE 
        WHEN NOT (($1::jsonb) ? 'social_networks') THEN "social_networks"
        WHEN (($1::jsonb)->>'social_networks') IS NULL THEN NULL
        ELSE ARRAY(SELECT jsonb_array_elements_text(($1::jsonb)->'social_networks'))
    END,

    -- Update only if exists; apply DEFAULT enum if null
    "profile_frame" = CASE 
        WHEN NOT (($1::jsonb) ? 'profile_frame') THEN "profile_frame"
        WHEN (($1::jsonb)->>'profile_frame') IS NULL THEN 'DEFAULT'::"ProfileFrame"
        ELSE (($1::jsonb)->>'profile_frame')::"ProfileFrame"
    END,
    "profile_background" = CASE 
        WHEN NOT (($1::jsonb) ? 'profile_background') THEN "profile_background"
        WHEN (($1::jsonb)->>'profile_background') IS NULL THEN 'DEFAULT'::"ProfileBackground"
        ELSE (($1::jsonb)->>'profile_background')::"ProfileBackground"
    END,

    -- Always bump timestamp
    "updated_at" = NOW()

WHERE "id" = $2::uuid
RETURNING user_id, nickname, full_name, email, google_id, bio, password_hash, avatar_url, max_streak, timezone, streak_start_date, last_watch_date, profile_frame_url, profile_background_url, user_role, user_status, created_at, updated_at`;

export interface PatchUserByIdArgs {
    patchData: any;
    userId: string;
}

export interface PatchUserByIdRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    googleId: string | null;
    bio: string;
    passwordHash: string | null;
    avatarUrl: string;
    maxStreak: number;
    timezone: string;
    streakStartDate: Date | null;
    lastWatchDate: Date | null;
    profileFrameUrl: string | null;
    profileBackgroundUrl: string | null;
    userRole: string;
    userStatus: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function patchUserById(client: Client, args: PatchUserByIdArgs): Promise<PatchUserByIdRow | null> {
    const result = await client.query({
        text: patchUserByIdQuery,
        values: [args.patchData, args.userId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userId: row[0],
        nickname: row[1],
        fullName: row[2],
        email: row[3],
        googleId: row[4],
        bio: row[5],
        passwordHash: row[6],
        avatarUrl: row[7],
        maxStreak: row[8],
        timezone: row[9],
        streakStartDate: row[10],
        lastWatchDate: row[11],
        profileFrameUrl: row[12],
        profileBackgroundUrl: row[13],
        userRole: row[14],
        userStatus: row[15],
        createdAt: row[16],
        updatedAt: row[17]
    };
}

export const selectUserByIdQuery = `-- name: SelectUserById :one
SELECT user_id, nickname, full_name, email, google_id, bio, password_hash, avatar_url, max_streak, timezone, streak_start_date, last_watch_date, profile_frame_url, profile_background_url, user_role, user_status, created_at, updated_at
FROM public.users
WHERE "id" = $1::uuid
LIMIT 1`;

export interface SelectUserByIdArgs {
    userId: string;
}

export interface SelectUserByIdRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    googleId: string | null;
    bio: string;
    passwordHash: string | null;
    avatarUrl: string;
    maxStreak: number;
    timezone: string;
    streakStartDate: Date | null;
    lastWatchDate: Date | null;
    profileFrameUrl: string | null;
    profileBackgroundUrl: string | null;
    userRole: string;
    userStatus: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function selectUserById(client: Client, args: SelectUserByIdArgs): Promise<SelectUserByIdRow | null> {
    const result = await client.query({
        text: selectUserByIdQuery,
        values: [args.userId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userId: row[0],
        nickname: row[1],
        fullName: row[2],
        email: row[3],
        googleId: row[4],
        bio: row[5],
        passwordHash: row[6],
        avatarUrl: row[7],
        maxStreak: row[8],
        timezone: row[9],
        streakStartDate: row[10],
        lastWatchDate: row[11],
        profileFrameUrl: row[12],
        profileBackgroundUrl: row[13],
        userRole: row[14],
        userStatus: row[15],
        createdAt: row[16],
        updatedAt: row[17]
    };
}

export const getAvatarIdByUserIdQuery = `-- name: GetAvatarIdByUserId :one
SELECT avatar_url
FROM public.users
WHERE user_id = $1`;

export interface GetAvatarIdByUserIdArgs {
    userId: string;
}

export interface GetAvatarIdByUserIdRow {
    avatarUrl: string;
}

export async function getAvatarIdByUserId(client: Client, args: GetAvatarIdByUserIdArgs): Promise<GetAvatarIdByUserIdRow | null> {
    const result = await client.query({
        text: getAvatarIdByUserIdQuery,
        values: [args.userId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        avatarUrl: row[0]
    };
}

export const safeUpdateUserAvatarReturningModificationFlagQuery = `-- name: SafeUpdateUserAvatarReturningModificationFlag :one
UPDATE public.users
SET avatar_url = $2::text
WHERE user_id = $1
  AND avatar_url = $3::text
RETURNING count(*) = 1 AS affected`;

export interface SafeUpdateUserAvatarReturningModificationFlagArgs {
    userId: string;
    newAvatarUrl: string;
    oldAvatarUrl: string;
}

export interface SafeUpdateUserAvatarReturningModificationFlagRow {
    affected: boolean;
}

export async function safeUpdateUserAvatarReturningModificationFlag(client: Client, args: SafeUpdateUserAvatarReturningModificationFlagArgs): Promise<SafeUpdateUserAvatarReturningModificationFlagRow | null> {
    const result = await client.query({
        text: safeUpdateUserAvatarReturningModificationFlagQuery,
        values: [args.userId, args.newAvatarUrl, args.oldAvatarUrl],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        affected: row[0]
    };
}

export const updateUserAvatarReturningOldQuery = `-- name: UpdateUserAvatarReturningOld :one
UPDATE public.users
SET avatar_url = $2::text
WHERE user_id = $1
RETURNING avatar_url`;

export interface UpdateUserAvatarReturningOldArgs {
    userId: string;
    newAvatarUrl: string;
}

export interface UpdateUserAvatarReturningOldRow {
    avatarUrl: string;
}

export async function updateUserAvatarReturningOld(client: Client, args: UpdateUserAvatarReturningOldArgs): Promise<UpdateUserAvatarReturningOldRow | null> {
    const result = await client.query({
        text: updateUserAvatarReturningOldQuery,
        values: [args.userId, args.newAvatarUrl],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        avatarUrl: row[0]
    };
}

