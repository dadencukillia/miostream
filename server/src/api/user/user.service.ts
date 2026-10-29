import type { Pool } from 'pg';
import * as usersSqlc from '../../sqlc/users_sql';
import * as userLinksSqlc from '../../sqlc/user_links_sql';
import { UserError, UserInvalidError, UserNotFoundError } from './user.errors';
import type {
    CreateUserDto,
    UpdateUserProfileDto,
    UpdateUserCustomizationDto,
    UpdateUserPasswordDto,
    UserStatus,
    UserRole
} from './user.schema';

const hashPassword = async (password: string): Promise<string> => {
    const hashedPassword = Bun.password.hash(password, { algorithm: "bcrypt" });
    return hashedPassword;
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const isMatch = await Bun.password.verify(password, hash);
    return isMatch;
};

export const createUser = async (client: Pool, data: CreateUserDto) => {
    const passwordHash = data.password ? await hashPassword(data.password) : null;

    const user = await usersSqlc.createUser(client, {
        nickname: data.nickname,
        fullName: data.fullName,
        email: data.email,
        passwordHash: passwordHash,
        googleId: data.googleId ?? null,
        timezone: data.timezone ?? null
    });

    if (!user) {
        throw new UserError('Failed to create user');
    }

    return user;
};

export const getUserById = async (client: Pool, userId: string) => {
    const user = await usersSqlc.getUserById(client, { userId });
    if (!user) {
        throw new UserNotFoundError(`User with id '${userId}' not found`);
    }
    return user;
};

export const getUserByEmail = async (client: Pool, email: string) => {
    const user = await usersSqlc.getUserByEmail(client, { email });
    if (!user) {
        throw new UserNotFoundError(`User with email '${email}' not found`);
    }
    return user;
};

export const getUserByGoogleId = async (client: Pool, googleId: string) => {
    const user = await usersSqlc.getUserByGoogleId(client, { googleId });
    if (!user) {
        throw new UserNotFoundError(`User with Google ID '${googleId}' not found`);
    }
    return user;
};

export const deleteUserById = async (client: Pool, userId: string) => {
    await usersSqlc.deleteUserById(client, { userId });
};

export const updateUserProfile = async (client: Pool, userId: string, data: UpdateUserProfileDto) => {
    const user = await usersSqlc.updateUserProfile(client, {
        userId: userId,
        nickname: data.nickname,
        fullName: data.fullName,
        bio: data.bio,
        timezone: data.timezone
    });
    if (!user) {
        throw new UserNotFoundError(`User with id '${userId}' not found`);
    }
    return user;
};

export const updateUserAvatar = async (client: Pool, userId: string, avatarUrl: string) => {
    const user = await usersSqlc.updateUserAvatar(client, {
        userId: userId,
        avatarUrl: avatarUrl
    });
    if (!user) {
        throw new UserNotFoundError(`User with id '${userId}' not found`);
    }
    return user;
};

export const updateUserCustomization = async (client: Pool, userId: string, data: UpdateUserCustomizationDto) => {
    const user = await usersSqlc.updateUserCustomization(client, {
        userId: userId,
        profileFrameUrl: data.profileFrameUrl ?? null,
        profileBackgroundUrl: data.profileBackgroundUrl ?? null
    });
    if (!user) {
        throw new UserNotFoundError(`User with id '${userId}' not found`);
    }
    return user;
};

export const updateUserPassword = async (client: Pool, userId: string, data: UpdateUserPasswordDto) => {
    const userRow = await usersSqlc.getPasswordHashById(client, { userId: userId })
    if (!userRow) throw new UserNotFoundError(`User with id '${userId}' not found`);
    if (!userRow.passwordHash) throw new UserInvalidError('User does not have a password set');

    const isMatch = verifyPassword(data.oldPassword, userRow.passwordHash)
    if (!isMatch) throw new UserInvalidError('Invalid old password');

    const hashedPassword = await hashPassword(data.newPassword);

    const user = await usersSqlc.updateUserPassword(client, {
        userId: userId,
        passwordHash: hashedPassword
    });

    if (!user) {
        throw new UserNotFoundError(`User with id '${userId}' not found`);
    }
};

export const updateUserStatus = async (client: Pool, userId: string, status: UserStatus) => {
    const user = await usersSqlc.updateUserStatus(client, {
        userId: userId,
        userStatus: status
    });
    if (!user) {
        throw new UserNotFoundError(`User with id '${userId}' not found`);
    }
    return user;
};

export const updateUserRole = async (client: Pool, userId: string, role: UserRole) => {
    const user = await usersSqlc.updateUserRole(client, {
        userId: userId,
        userRole: role
    });
    if (!user) {
        throw new UserNotFoundError(`User with id '${userId}' not found`);
    }
    return user;
};

export const createUserLink = async (client: Pool, userId: string, url: string) => {
    const link = await userLinksSqlc.createUserLink(client, {
        userId: userId,
        userLinkUrl: url
    });
    if (!link) {
        throw new UserError('Failed to create user link');
    }
    return link;
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
    const link = await userLinksSqlc.updateUserLink(client, {
        userId: userId,
        userLinkId: String(linkId),
        userLinkUrl: url
    });
    if (!link) {
        throw new UserNotFoundError(`User link with id '${linkId}' not found`);
    }
    return link;
};

export const deleteUserLinkById = async (
    client: Pool,
    userId: string,
    linkId: string | number | bigint
) => {
    const link = await userLinksSqlc.deleteUserLink(client, {
        userId: userId,
        userLinkId: String(linkId)
    });
    return link;
};

export const deleteAllUserLinksByUserId = async (client: Pool, userId: string) => {
    await userLinksSqlc.deleteAllUserLinksByUserId(client, { userId });
};