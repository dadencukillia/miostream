import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createUserQuery = `-- name: CreateUser :one
INSERT INTO public.users (
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
    COALESCE($6, 'Europe/Kyiv')
)
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_url",
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
        avatarUrl: row[5],
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
    "avatar_url",
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
        avatarUrl: row[5],
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
    "avatar_url",
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
        avatarUrl: row[5],
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
    "avatar_url",
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
        avatarUrl: row[5],
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

export const updateUserProfileQuery = `-- name: UpdateUserProfile :one
UPDATE public.users
SET 
    "nickname"   = $1,
    "full_name"  = $2,
    "bio"        = $3,
    "timezone"   = $4,
    "updated_at" = NOW()
WHERE "user_id" = $5::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_url",
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
        avatarUrl: row[5],
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

export const updateUserAvatarQuery = `-- name: UpdateUserAvatar :one
UPDATE public.users
SET
    "avatar_url" = $1,
    "updated_at" = NOW()
WHERE "user_id" = $2::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_url",
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

export interface UpdateUserAvatarArgs {
    avatarUrl: string;
    userId: string;
}

export interface UpdateUserAvatarRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
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

export async function updateUserAvatar(client: Client, args: UpdateUserAvatarArgs): Promise<UpdateUserAvatarRow | null> {
    const result = await client.query({
        text: updateUserAvatarQuery,
        values: [args.avatarUrl, args.userId],
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
        avatarUrl: row[5],
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
    "profile_frame_url"      = $1,
    "profile_background_url" = $2,
    "updated_at"             = NOW()
WHERE "user_id" = $3::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_url",
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
    profileFrameUrl: string | null;
    profileBackgroundUrl: string | null;
    userId: string;
}

export interface UpdateUserCustomizationRow {
    userId: string;
    nickname: string;
    fullName: string;
    email: string;
    bio: string;
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

export async function updateUserCustomization(client: Client, args: UpdateUserCustomizationArgs): Promise<UpdateUserCustomizationRow | null> {
    const result = await client.query({
        text: updateUserCustomizationQuery,
        values: [args.profileFrameUrl, args.profileBackgroundUrl, args.userId],
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
        avatarUrl: row[5],
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
    "updated_at"    = NOW()
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
    "updated_at"        = NOW()
WHERE "user_id" = $4::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_url",
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
        avatarUrl: row[5],
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
    "updated_at"  = NOW()
WHERE "user_id" = $2::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_url",
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
        avatarUrl: row[5],
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
    "updated_at"  = NOW()
WHERE "user_id" = $2::uuid
RETURNING 
    "user_id",
    "nickname",
    "full_name",
    "email",
    "bio",
    "avatar_url",
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
        avatarUrl: row[5],
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

export const deleteUserByIdQuery = `-- name: DeleteUserById :exec
DELETE FROM public.users
WHERE "user_id" = $1::uuid`;

export interface DeleteUserByIdArgs {
    userId: string;
}

export async function deleteUserById(client: Client, args: DeleteUserByIdArgs): Promise<void> {
    await client.query({
        text: deleteUserByIdQuery,
        values: [args.userId],
        rowMode: "array"
    });
}

