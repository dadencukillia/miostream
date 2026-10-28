import type { Pool } from 'pg';
import * as usersSqlc from '../../sqlc/users_sql';
import * as userLinksSqlc from '../../sqlc/user_links_sql';
import type {
    CreateUserDto,
    UpdateUserProfileDto,
    UpdateUserCustomizationDto,
    UpdateUserPasswordDto,
    UserStatus,
    UserRole
} from './user.schema';

const hashPassword = async (password: string): Promise<string> => {
    // TODO: add good password hashing logic
    return `hashed_${password}`;
};

export const createUser = async (client: Pool, data: CreateUserDto) => {
    const passwordHash = data.password ? await hashPassword(data.password) : null;

    return await usersSqlc.createUser(client, {
        nickname: data.nickname,
        fullName: data.full_name,
        email: data.email,
        passwordHash: passwordHash,
        googleId: data.google_id ?? null,
        timezone: data.timezone ?? null
    });
};

export const getUserById = async (client: Pool, userId: string) => {
    return await usersSqlc.getUserById(client, { userId });
};

export const getUserByEmail = async (client: Pool, email: string) => {
    return await usersSqlc.getUserByEmail(client, { email });
};

export const getUserByGoogleId = async (client: Pool, googleId: string) => {
    return await usersSqlc.getUserByGoogleId(client, { googleId });
};

export const deleteUserById = async (client: Pool, userId: string) => {
    return await usersSqlc.deleteUserById(client, { userId });
};

export const updateUserProfile = async (client: Pool, userId: string, data: UpdateUserProfileDto) => {
    return await usersSqlc.updateUserProfile(client, {
        userId: userId,
        nickname: data.nickname,
        fullName: data.full_name,
        bio: data.bio,
        timezone: data.timezone
    });
};

export const updateUserAvatar = async (client: Pool, userId: string, avatarUrl: string) => {
    return await usersSqlc.updateUserAvatar(client, {
        userId: userId,
        avatarUrl: avatarUrl
    });
};

export const updateUserCustomization = async (client: Pool, userId: string, data: UpdateUserCustomizationDto) => {
    return await usersSqlc.updateUserCustomization(client, {
        userId: userId,
        profileFrameUrl: data.profile_frame_url ?? null,
        profileBackgroundUrl: data.profile_background_url ?? null
    });
};

export const updateUserPassword = async (client: Pool, userId: string, data: UpdateUserPasswordDto) => {
    const passwordHash = await hashPassword(data.new_password);

    await usersSqlc.updateUserPassword(client, {
        userId: userId,
        passwordHash: passwordHash
    });
};

export const updateUserStatus = async (client: Pool, userId: string, status: UserStatus) => {
    return await usersSqlc.updateUserStatus(client, {
        userId: userId,
        userStatus: status
    });
};

export const updateUserRole = async (client: Pool, userId: string, role: UserRole) => {
    return await usersSqlc.updateUserRole(client, {
        userId: userId,
        userRole: role
    });
};

export const updateUserStreak = async (
    client: Pool,
    userId: string,
    data: { max_streak: number; streak_start_date: Date | null; last_watch_date: Date | null }
) => {
    return await usersSqlc.updateUserStreak(client, {
        userId: userId,
        maxStreak: data.max_streak,
        streakStartDate: data.streak_start_date,
        lastWatchDate: data.last_watch_date
    });
};

export const createUserLink = async (client: Pool, userId: string, url: string) => {
    return await userLinksSqlc.createUserLink(client, {
        userId: userId,
        userLinkUrl: url
    });
};

export const listUserLinksByUserId = async (client: Pool, userId: string) => {
    return await userLinksSqlc.listUserLinksByUserId(client, { userId });
};

export const updateUserLink = async (
    client: Pool,
    userId: string,
    linkId: string | number | bigint,
    url: string
) => {
    return await userLinksSqlc.updateUserLink(client, {
        userId: userId,
        userLinkId: String(linkId),
        userLinkUrl: url
    });
};

export const deleteUserLinkById = async (
    client: Pool,
    userId: string,
    linkId: string | number | bigint
) => {
    return await userLinksSqlc.deleteUserLinkById(client, {
        userId: userId,
        userLinkId: String(linkId)
    });
};

export const deleteAllUserLinksByUserId = async (client: Pool, userId: string) => {
    await userLinksSqlc.deleteAllUserLinksByUserId(client, { userId });
};