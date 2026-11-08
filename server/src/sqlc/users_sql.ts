import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createUserQuery = `-- name: CreateUser :one
INSERT INTO public.users(
    "nickname",
    "full_name",
    "email",
    "password_hash",
    "google_id",
    "timezone"
) VALUES (
    $1, 
    $2, 
    $3, 
    $4,
    $5,
    coalesce($6, 'Europe/Kyiv')
)
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"`;

export interface CreateUserArgs {
    nickname: string;
    fullName: string;
    email: string;
    passwordHash: string | null;
    googleId: string | null;
    timezone: string | null;
}

export interface CreateUserRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
    avatarId: string | null;
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

export async function createUser(client: Client, args: CreateUserArgs): Promise<CreateUserRow | null> {
    const result = await client.query({
        text: createUserQuery,
        values: [args.nickname, args.fullName, args.email, args.passwordHash, args.googleId, args.timezone],
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
        bio: row[4],
        avatarId: row[5],
        maxStreak: row[6],
        timezone: row[7],
        streakStartDate: row[8],
        lastWatchDate: row[9],
        profileFrameUrl: row[10],
        profileBackgroundUrl: row[11],
        userRole: row[12],
        userStatus: row[13],
        createdAt: row[14],
        updatedAt: row[15]
    };
}

export const getUserByIdQuery = `-- name: GetUserById :one
SELECT 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"
FROM public.users
WHERE "user_id" = $1::uuid
LIMIT 1`;

export interface GetUserByIdArgs {
    userId: string;
}

export interface GetUserByIdRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
    avatarId: string | null;
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

export async function getUserById(client: Client, args: GetUserByIdArgs): Promise<GetUserByIdRow | null> {
    const result = await client.query({
        text: getUserByIdQuery,
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
        bio: row[4],
        avatarId: row[5],
        maxStreak: row[6],
        timezone: row[7],
        streakStartDate: row[8],
        lastWatchDate: row[9],
        profileFrameUrl: row[10],
        profileBackgroundUrl: row[11],
        userRole: row[12],
        userStatus: row[13],
        createdAt: row[14],
        updatedAt: row[15]
    };
}

export const getUserByEmailQuery = `-- name: GetUserByEmail :one
SELECT 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"
FROM public.users
WHERE lower("email") = lower($1)
LIMIT 1`;

export interface GetUserByEmailArgs {
    email: string;
}

export interface GetUserByEmailRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
    avatarId: string | null;
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

export async function getUserByEmail(client: Client, args: GetUserByEmailArgs): Promise<GetUserByEmailRow | null> {
    const result = await client.query({
        text: getUserByEmailQuery,
        values: [args.email],
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
        bio: row[4],
        avatarId: row[5],
        maxStreak: row[6],
        timezone: row[7],
        streakStartDate: row[8],
        lastWatchDate: row[9],
        profileFrameUrl: row[10],
        profileBackgroundUrl: row[11],
        userRole: row[12],
        userStatus: row[13],
        createdAt: row[14],
        updatedAt: row[15]
    };
}

export const getUserByGoogleIdQuery = `-- name: GetUserByGoogleId :one
SELECT 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"
FROM public.users
WHERE "google_id" = $1
LIMIT 1`;

export interface GetUserByGoogleIdArgs {
    googleId: string | null;
}

export interface GetUserByGoogleIdRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
    avatarId: string | null;
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

export async function getUserByGoogleId(client: Client, args: GetUserByGoogleIdArgs): Promise<GetUserByGoogleIdRow | null> {
    const result = await client.query({
        text: getUserByGoogleIdQuery,
        values: [args.googleId],
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
        bio: row[4],
        avatarId: row[5],
        maxStreak: row[6],
        timezone: row[7],
        streakStartDate: row[8],
        lastWatchDate: row[9],
        profileFrameUrl: row[10],
        profileBackgroundUrl: row[11],
        userRole: row[12],
        userStatus: row[13],
        createdAt: row[14],
        updatedAt: row[15]
    };
}

export const getPasswordHashByIdQuery = `-- name: GetPasswordHashById :one
SELECT "password_hash"
FROM public.users
WHERE "user_id" = $1::uuid
LIMIT 1`;

export interface GetPasswordHashByIdArgs {
    userId: string;
}

export interface GetPasswordHashByIdRow {
    passwordHash: string | null;
}

export async function getPasswordHashById(client: Client, args: GetPasswordHashByIdArgs): Promise<GetPasswordHashByIdRow | null> {
    const result = await client.query({
        text: getPasswordHashByIdQuery,
        values: [args.userId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        passwordHash: row[0]
    };
}

export const updateUserProfileQuery = `-- name: UpdateUserProfile :one
UPDATE public.users
SET 
    "nickname"   = $1,
    "full_name"  = $2,
    "bio"        = $3,
    "timezone"   = $4,
    "updated_at" = now()
WHERE "user_id" = $5::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"`;

export interface UpdateUserProfileArgs {
    nickname: string;
    fullName: string;
    bio: string;
    timezone: string;
    userId: string;
}

export interface UpdateUserProfileRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
    avatarId: string | null;
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

export async function updateUserProfile(client: Client, args: UpdateUserProfileArgs): Promise<UpdateUserProfileRow | null> {
    const result = await client.query({
        text: updateUserProfileQuery,
        values: [args.nickname, args.fullName, args.bio, args.timezone, args.userId],
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
        bio: row[4],
        avatarId: row[5],
        maxStreak: row[6],
        timezone: row[7],
        streakStartDate: row[8],
        lastWatchDate: row[9],
        profileFrameUrl: row[10],
        profileBackgroundUrl: row[11],
        userRole: row[12],
        userStatus: row[13],
        createdAt: row[14],
        updatedAt: row[15]
    };
}

export const updateUserCustomizationQuery = `-- name: UpdateUserCustomization :one
UPDATE public.users 
SET 
    "profile_frame_url" = CASE 
        WHEN $1::boolean
        THEN $2::text
        ELSE profile_frame_url END,
    "profile_background_url" = CASE 
        WHEN $3::boolean
        THEN $4::text
        ELSE profile_background_url END,
    "updated_at" = now()
WHERE "user_id" = $5::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"`;

export interface UpdateUserCustomizationArgs {
    setFrame: boolean;
    profileFrameUrl: string | null;
    setBackground: boolean;
    profileBackgroundUrl: string | null;
    userId: string;
}

export interface UpdateUserCustomizationRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
    avatarId: string | null;
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

export async function updateUserCustomization(client: Client, args: UpdateUserCustomizationArgs): Promise<UpdateUserCustomizationRow | null> {
    const result = await client.query({
        text: updateUserCustomizationQuery,
        values: [args.setFrame, args.profileFrameUrl, args.setBackground, args.profileBackgroundUrl, args.userId],
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
        bio: row[4],
        avatarId: row[5],
        maxStreak: row[6],
        timezone: row[7],
        streakStartDate: row[8],
        lastWatchDate: row[9],
        profileFrameUrl: row[10],
        profileBackgroundUrl: row[11],
        userRole: row[12],
        userStatus: row[13],
        createdAt: row[14],
        updatedAt: row[15]
    };
}

export const updateUserPasswordQuery = `-- name: UpdateUserPassword :one
UPDATE public.users
SET 
    "password_hash" = $1,
    "updated_at"    = now()
WHERE "user_id" = $2::uuid
RETURNING "user_id"`;

export interface UpdateUserPasswordArgs {
    passwordHash: string | null;
    userId: string;
}

export interface UpdateUserPasswordRow {
    userId: string;
}

export async function updateUserPassword(client: Client, args: UpdateUserPasswordArgs): Promise<UpdateUserPasswordRow | null> {
    const result = await client.query({
        text: updateUserPasswordQuery,
        values: [args.passwordHash, args.userId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        userId: row[0]
    };
}

export const updateUserStreakQuery = `-- name: UpdateUserStreak :one
UPDATE public.users
SET 
    "max_streak"        = $1,
    "streak_start_date" = $2,
    "last_watch_date"   = $3,
    "updated_at"        = now()
WHERE "user_id" = $4::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"`;

export interface UpdateUserStreakArgs {
    maxStreak: number;
    streakStartDate: Date | null;
    lastWatchDate: Date | null;
    userId: string;
}

export interface UpdateUserStreakRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
    avatarId: string | null;
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

export async function updateUserStreak(client: Client, args: UpdateUserStreakArgs): Promise<UpdateUserStreakRow | null> {
    const result = await client.query({
        text: updateUserStreakQuery,
        values: [args.maxStreak, args.streakStartDate, args.lastWatchDate, args.userId],
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
        bio: row[4],
        avatarId: row[5],
        maxStreak: row[6],
        timezone: row[7],
        streakStartDate: row[8],
        lastWatchDate: row[9],
        profileFrameUrl: row[10],
        profileBackgroundUrl: row[11],
        userRole: row[12],
        userStatus: row[13],
        createdAt: row[14],
        updatedAt: row[15]
    };
}

export const updateUserStatusQuery = `-- name: UpdateUserStatus :one
UPDATE public.users
SET
    "user_status" = $1,
    "updated_at"  = now()
WHERE "user_id" = $2::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"`;

export interface UpdateUserStatusArgs {
    userStatus: string;
    userId: string;
}

export interface UpdateUserStatusRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
    avatarId: string | null;
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

export async function updateUserStatus(client: Client, args: UpdateUserStatusArgs): Promise<UpdateUserStatusRow | null> {
    const result = await client.query({
        text: updateUserStatusQuery,
        values: [args.userStatus, args.userId],
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
        bio: row[4],
        avatarId: row[5],
        maxStreak: row[6],
        timezone: row[7],
        streakStartDate: row[8],
        lastWatchDate: row[9],
        profileFrameUrl: row[10],
        profileBackgroundUrl: row[11],
        userRole: row[12],
        userStatus: row[13],
        createdAt: row[14],
        updatedAt: row[15]
    };
}

export const updateUserRoleQuery = `-- name: UpdateUserRole :one
UPDATE public.users
SET 
    "user_role"   = $1,
    "updated_at"  = now()
WHERE "user_id" = $2::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_id",
    "max_streak",
    "timezone",
    "streak_start_date",
    "last_watch_date",
    "profile_frame_url",
    "profile_background_url",
    "user_role",
    "user_status",
    "created_at",
    "updated_at"`;

export interface UpdateUserRoleArgs {
    userRole: string;
    userId: string;
}

export interface UpdateUserRoleRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
    avatarId: string | null;
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

export async function updateUserRole(client: Client, args: UpdateUserRoleArgs): Promise<UpdateUserRoleRow | null> {
    const result = await client.query({
        text: updateUserRoleQuery,
        values: [args.userRole, args.userId],
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
        bio: row[4],
        avatarId: row[5],
        maxStreak: row[6],
        timezone: row[7],
        streakStartDate: row[8],
        lastWatchDate: row[9],
        profileFrameUrl: row[10],
        profileBackgroundUrl: row[11],
        userRole: row[12],
        userStatus: row[13],
        createdAt: row[14],
        updatedAt: row[15]
    };
}

export const deleteUserByIdQuery = `-- name: DeleteUserById :one
DELETE FROM public.users
WHERE "user_id" = $1::uuid
RETURNING "user_id"`;

export interface DeleteUserByIdArgs {
    userId: string;
}

export interface DeleteUserByIdRow {
    userId: string;
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
        userId: row[0]
    };
}

export const selectUserByIdQuery = `-- name: SelectUserById :one
SELECT user_id, nickname, full_name, email, google_id, bio, password_hash, max_streak, timezone, streak_start_date, last_watch_date, profile_frame_url, profile_background_url, user_role, user_status, created_at, updated_at, avatar_id
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
    avatarId: string | null;
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
        maxStreak: row[7],
        timezone: row[8],
        streakStartDate: row[9],
        lastWatchDate: row[10],
        profileFrameUrl: row[11],
        profileBackgroundUrl: row[12],
        userRole: row[13],
        userStatus: row[14],
        createdAt: row[15],
        updatedAt: row[16],
        avatarId: row[17]
    };
}

export const getAvatarIdByUserIdQuery = `-- name: GetAvatarIdByUserId :one
SELECT avatar_id
FROM public.users
WHERE user_id = $1
LIMIT 1`;

export interface GetAvatarIdByUserIdArgs {
    userId: string;
}

export interface GetAvatarIdByUserIdRow {
    avatarId: string | null;
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
        avatarId: row[0]
    };
}

export const updateUserAvatarReturningOldQuery = `-- name: UpdateUserAvatarReturningOld :one
WITH old_vals AS (
  SELECT avatar_id, user_id 
  FROM public.users
  WHERE "user_id" = $2::uuid
) UPDATE public.users u
SET
  "avatar_id" = $1::uuid,
  "updated_at" = now()
FROM old_vals o
WHERE "user_id" = o.user_id
RETURNING
    o."user_id",
    u."nickname",
    u."full_name",
    u."email",
    u."bio",
    u."avatar_id",
    o."avatar_id" AS old_avatar_id,
    u."max_streak",
    u."timezone",
    u."streak_start_date",
    u."last_watch_date",
    u."profile_frame_url",
    u."profile_background_url",
    u."user_role",
    u."user_status",
    u."created_at",
    u."updated_at"`;

export interface UpdateUserAvatarReturningOldArgs {
    newAvatarId: string;
    userId: string;
}

export interface UpdateUserAvatarReturningOldRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
    avatarId: string | null;
    oldAvatarId: string | null;
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

export async function updateUserAvatarReturningOld(client: Client, args: UpdateUserAvatarReturningOldArgs): Promise<UpdateUserAvatarReturningOldRow | null> {
    const result = await client.query({
        text: updateUserAvatarReturningOldQuery,
        values: [args.newAvatarId, args.userId],
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
        bio: row[4],
        avatarId: row[5],
        oldAvatarId: row[6],
        maxStreak: row[7],
        timezone: row[8],
        streakStartDate: row[9],
        lastWatchDate: row[10],
        profileFrameUrl: row[11],
        profileBackgroundUrl: row[12],
        userRole: row[13],
        userStatus: row[14],
        createdAt: row[15],
        updatedAt: row[16]
    };
}

