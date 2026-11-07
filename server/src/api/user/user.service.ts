import type { Pool } from 'pg';
import * as usersSqlc from '../../sqlc/users_sql';
import * as userLinksSqlc from '../../sqlc/user_links_sql';
import {
    UserError,
    UserInvalidError,
    UserNotFoundError,
    UserAlreadyExistsError
} from './user.errors';
import type {
    CreateUserDto,
    UpdateUserProfileDto,
    UpdateUserCustomizationDto,
    UpdateUserPasswordDto,
    UserStatus,
    UserRole
} from './user.schema';
import { hashPassword, verifyPassword } from '../../utils/password';

interface PostgresError extends Error {
    code?: string;
    constraint?: string;
    detail?: string;
}

const dbError = (error: unknown): UserError => {
    if (error instanceof UserError) {
        return error;
    }

    const pgErr = error as PostgresError;

    // 23505: Unique Violation
    if (pgErr.code === '23505') {
        const constraint = pgErr.constraint ?? '';

        if (constraint.includes('nickname')) {
            return new UserAlreadyExistsError('User with this nickname already exists');
        }
        if (constraint.includes('email')) {
            return new UserAlreadyExistsError('User with this email already exists');
        }
        if (constraint.includes('google_id')) {
            return new UserAlreadyExistsError('This Google account is already linked to another user');
        }
        if (constraint.includes('user_link') || constraint.includes('user_links')) {
            return new UserAlreadyExistsError('This link already exists in user profile');
        }

        return new UserAlreadyExistsError('Record with these unique attributes already exists');
    }

    // 23503: Foreign Key Violation
    if (pgErr.code === '23503') {
        const constraint = pgErr.constraint ?? '';
        if (constraint.includes('user_id')) {
            return new UserNotFoundError('Referenced user does not exist');
        }
        return new UserInvalidError('Referenced resource does not exist');
    }

    // 23514: Check Constraint Violation
    if (pgErr.code === '23514') {
        return new UserInvalidError('Data does not satisfy database constraints');
    }

    // 22P02: Invalid Text Representation
    if (pgErr.code === '22P02') {
        return new UserInvalidError('Invalid identifier format');
    }

    // 22003: Numeric Value Out Of Range
    if (pgErr.code === '22003') {
        return new UserInvalidError('Numeric value is out of range');
    }

    // 22001: String Data Right Truncation
    if (pgErr.code === '22001') {
        return new UserInvalidError('Value is too long');
    }

    return new UserError('Database operation failed', { cause: error });
};

export const createUser = async (client: Pool, data: CreateUserDto) => {
    try {
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
            throw new UserError('Failed to create user record');
        }

        return user;
    } catch (error) {
        throw dbError(error);
    }
};

export const getUserById = async (client: Pool, userId: string) => {
    try {
        const user = await usersSqlc.getUserById(client, { userId });
        if (!user) {
            throw new UserNotFoundError(`User with id '${userId}' not found`);
        }
        return user;
    } catch (error) {
        throw dbError(error);
    }
};

// TODO(auth): move getUserByEmail/getUserByGoogleId to an auth module; keep email/googleId out of client-facing errors.
export const getUserByEmail = async (client: Pool, email: string) => {
    try {
        const user = await usersSqlc.getUserByEmail(client, { email });
        if (!user) {
            throw new UserNotFoundError(`User with email '${email}' not found`);
        }
        return user;
    } catch (error) {
        throw dbError(error);
    }
};

export const getUserByGoogleId = async (client: Pool, googleId: string) => {
    try {
        const user = await usersSqlc.getUserByGoogleId(client, { googleId });
        if (!user) {
            throw new UserNotFoundError(`User with Google ID '${googleId}' not found`);
        }
        return user;
    } catch (error) {
        throw dbError(error);
    }
};

export const deleteUserById = async (client: Pool, userId: string) => {
    try {
        const deleted = await usersSqlc.deleteUserById(client, { userId });
        if (!deleted) {
            throw new UserNotFoundError(`User with id '${userId}' not found`);
        }
    } catch (error) {
        throw dbError(error);
    }
};

export const updateUserProfile = async (client: Pool, userId: string, data: UpdateUserProfileDto) => {
    try {
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
    } catch (error) {
        throw dbError(error);
    }
};

export const updateUserAvatar = async (client: Pool, userId: string, avatarUrl: string) => {
    try {
        const user = await usersSqlc.updateUserAvatar(client, {
            userId: userId,
            avatarUrl: avatarUrl
        });
        if (!user) {
            throw new UserNotFoundError(`User with id '${userId}' not found`);
        }
        return user;
    } catch (error) {
        throw dbError(error);
    }
};

export const updateUserCustomization = async (client: Pool, userId: string, data: UpdateUserCustomizationDto) => {
    try {
        const user = await usersSqlc.updateUserCustomization(client, {
            userId,
            setFrame: data.profileFrameUrl !== undefined,
            profileFrameUrl: data.profileFrameUrl ?? null,
            setBackground: data.profileBackgroundUrl !== undefined,
            profileBackgroundUrl: data.profileBackgroundUrl ?? null
        });
        if (!user) {
            throw new UserNotFoundError(`User with id '${userId}' not found`);
        }
        return user;
    } catch (error) {
        throw dbError(error);
    }
};

export const updateUserPassword = async (client: Pool, userId: string, data: UpdateUserPasswordDto) => {
    try {
        const userRow = await usersSqlc.getPasswordHashById(client, { userId });
        if (!userRow) {
            throw new UserNotFoundError(`User with id '${userId}' not found`);
        }
        if (!userRow.passwordHash) {
            throw new UserInvalidError('User registered via OAuth does not have a password set');
        }

        const isMatch = await verifyPassword(data.oldPassword, userRow.passwordHash);
        if (!isMatch) {
            throw new UserInvalidError('Invalid old password');
        }

        const hashedPassword = await hashPassword(data.newPassword);

        const updated = await usersSqlc.updateUserPassword(client, {
            userId: userId,
            passwordHash: hashedPassword
        });

        if (!updated) {
            throw new UserNotFoundError(`User with id '${userId}' not found`);
        }
    } catch (error) {
        throw dbError(error);
    }
};

export const updateUserStatus = async (client: Pool, userId: string, status: UserStatus) => {
    try {
        const user = await usersSqlc.updateUserStatus(client, {
            userId: userId,
            userStatus: status
        });
        if (!user) {
            throw new UserNotFoundError(`User with id '${userId}' not found`);
        }
        return user;
    } catch (error) {
        throw dbError(error);
    }
};

// TODO(admin): check last-admin rule.
export const updateUserRole = async (client: Pool, userId: string, role: UserRole) => {
    try {
        const user = await usersSqlc.updateUserRole(client, {
            userId: userId,
            userRole: role
        });
        if (!user) {
            throw new UserNotFoundError(`User with id '${userId}' not found`);
        }
        return user;
    } catch (error) {
        throw dbError(error);
    }
};

export const createUserLink = async (client: Pool, userId: string, url: string) => {
    try {
        const link = await userLinksSqlc.createUserLink(client, {
            userId: userId,
            userLinkUrl: url
        });
        if (!link) {
            throw new UserError('Failed to create user link');
        }
        return link;
    } catch (error) {
        throw dbError(error);
    }
};

export const listUserLinksByUserId = async (client: Pool, userId: string) => {
    try {
        return await userLinksSqlc.listUserLinksByUserId(client, { userId });
    } catch (error) {
        throw dbError(error);
    }
};

export const updateUserLink = async (
    client: Pool,
    userId: string,
    linkId: string | number | bigint,
    url: string
) => {
    try {
        const link = await userLinksSqlc.updateUserLink(client, {
            userId: userId,
            userLinkId: String(linkId),
            userLinkUrl: url
        });
        if (!link) {
            throw new UserNotFoundError(`User link with id '${linkId}' not found`);
        }
        return link;
    } catch (error) {
        throw dbError(error);
    }
};

export const deleteUserLinkById = async (
    client: Pool,
    userId: string,
    linkId: string | number | bigint
) => {
    try {
        const deleted = await userLinksSqlc.deleteUserLink(client, { userId, userLinkId: String(linkId) });
        if (!deleted) {
            throw new UserNotFoundError(`User link with id '${linkId}' not found`);
        }
    } catch (error) {
        throw dbError(error);
    }
};