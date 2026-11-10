import type { Pool } from "pg";
import * as usersSqlc from "@sqlc/users_sql";
import * as userLinksSqlc from "@sqlc/user_links_sql";
import { UserErrors } from "../user.errors";
import type {
    CreateUserDto,
    UpdateUserProfileDto,
    UpdateUserCustomizationDto,
    UpdateUserPasswordDto,
    UserStatus,
    UserRole
} from "../user.schema";
import { hashPassword, verifyPassword } from "@utils/password";

export const createUser = async (client: Pool, data: CreateUserDto) => {
    const passwordHash = data.password ? await hashPassword(data.password) : null;

    let user;
    try {
        user = await usersSqlc.createUser(client, {
            nickname: data.nickname,
            fullName: data.fullName,
            email: data.email,
            passwordHash: passwordHash,
            googleId: data.googleId ?? null,
            timezone: data.timezone ?? null
        });
    } catch (e: any) {
        if (e?.code === "23505") {
            const constraint = e?.constraint ?? "";
            if (constraint.includes("nickname")) {
                throw UserErrors.error("user-nickname-already-taken").withDetails(e);
            }
            if (constraint.includes("email")) {
                throw UserErrors.error("user-email-already-taken").withDetails(e);
            }
            if (constraint.includes("google_id")) {
                throw UserErrors.error("user-google-id-already-taken").withDetails(e);
            }
            throw UserErrors.error("user-already-exists").withDetails(e);
        }
        if (e?.code === "23514" || e?.code === "22P02" || e?.code === "22003" || e?.code === "22001") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!user) throw UserErrors.error("user-db-error");

    return user;
};

export const getUserById = async (client: Pool, userId: string) => {
    let user;
    try {
        user = await usersSqlc.getUserById(client, { userId });
    } catch (e: any) {
        if (e?.code === "22P02") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!user) throw UserErrors.error("user-not-found");
    return user;
};

// TODO(auth): move getUserByEmail/getUserByGoogleId to an auth module; keep email/googleId out of client-facing errors.
export const getUserByEmail = async (client: Pool, email: string) => {
    let user;
    try {
        user = await usersSqlc.getUserByEmail(client, { email });
    } catch (e) {
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!user) throw UserErrors.error("user-not-found");
    return user;
};

export const getUserByGoogleId = async (client: Pool, googleId: string) => {
    let user;
    try {
        user = await usersSqlc.getUserByGoogleId(client, { googleId });
    } catch (e) {
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!user) throw UserErrors.error("user-not-found");
    return user;
};

export const deleteUserById = async (client: Pool, userId: string) => {
    let deleted;
    try {
        deleted = await usersSqlc.deleteUserById(client, { userId });
    } catch (e: any) {
        if (e?.code === "22P02") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!deleted) throw UserErrors.error("user-not-found");
};

export const updateUserProfile = async (client: Pool, userId: string, data: UpdateUserProfileDto) => {
    let user;
    try {
        user = await usersSqlc.updateUserProfile(client, {
            userId: userId,
            nickname: data.nickname,
            fullName: data.fullName,
            bio: data.bio,
            timezone: data.timezone
        });
    } catch (e: any) {
        if (e?.code === "23505") {
            const constraint = e?.constraint ?? "";
            if (constraint.includes("nickname")) {
                throw UserErrors.error("user-nickname-already-taken").withDetails(e);
            }
            throw UserErrors.error("user-already-exists").withDetails(e);
        }
        if (e?.code === "23514" || e?.code === "22P02" || e?.code === "22003" || e?.code === "22001") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!user) throw UserErrors.error("user-not-found");
    return user;
};

export const updateUserCustomization = async (client: Pool, userId: string, data: UpdateUserCustomizationDto) => {
    let user;
    try {
        user = await usersSqlc.updateUserCustomization(client, {
            userId,
            setFrame: data.profileFrameUrl !== undefined,
            profileFrameUrl: data.profileFrameUrl ?? null,
            setBackground: data.profileBackgroundUrl !== undefined,
            profileBackgroundUrl: data.profileBackgroundUrl ?? null
        });
    } catch (e: any) {
        if (e?.code === "23514" || e?.code === "22P02" || e?.code === "22003" || e?.code === "22001") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!user) throw UserErrors.error("user-not-found");
    return user;
};

export const updateUserPassword = async (client: Pool, userId: string, data: UpdateUserPasswordDto) => {
    let user;
    try {
        user = await usersSqlc.getPasswordHashById(client, { userId });
    } catch (e: any) {
        if (e?.code === "22P02") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!user) throw UserErrors.error("user-not-found");
    if (!user.passwordHash) throw UserErrors.error("user-db-data-not-found");

    const isMatch = await verifyPassword(data.oldPassword, user.passwordHash);
    if (!isMatch) throw UserErrors.error("user-invalid");

    const hashedPassword = await hashPassword(data.newPassword);

    let updated;
    try {
        updated = await usersSqlc.updateUserPassword(client, {
            userId: userId,
            passwordHash: hashedPassword
        });
    } catch (e: any) {
        if (e?.code === "22P02") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!updated) throw UserErrors.error("user-not-found");
};

export const updateUserStatus = async (client: Pool, userId: string, status: UserStatus) => {
    let user;
    try {
        user = await usersSqlc.updateUserStatus(client, {
            userId: userId,
            userStatus: status
        });
    } catch (e: any) {
        if (e?.code === "23514" || e?.code === "22P02") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!user) throw UserErrors.error("user-not-found");
    return user;
};

// TODO(admin): add check of last-admin rule.
export const updateUserRole = async (client: Pool, userId: string, role: UserRole) => {
    let user;
    try {
        user = await usersSqlc.updateUserRole(client, {
            userId: userId,
            userRole: role
        });
    } catch (e: any) {
        if (e?.code === "23514" || e?.code === "22P02") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!user) throw UserErrors.error("user-not-found");
    return user;
};

export const createUserLink = async (client: Pool, userId: string, url: string) => {
    let link;
    try {
        link = await userLinksSqlc.createUserLink(client, {
            userId: userId,
            userLinkUrl: url
        });
    } catch (e: any) {
        if (e?.code === "23505") {
            throw UserErrors.error("user-link-already-exists").withDetails(e);
        }
        if (e?.code === "23503") {
            const constraint = e?.constraint ?? "";
            if (constraint.includes("user_id")) {
                throw UserErrors.error("user-not-found").withDetails(e);
            }
            throw UserErrors.error("user-db-data-not-found").withDetails(e);
        }
        if (e?.code === "23514" || e?.code === "22P02" || e?.code === "22003" || e?.code === "22001") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!link) throw UserErrors.error("user-db-error");
    return link;
};

export const listUserLinksByUserId = async (client: Pool, userId: string) => {
    try {
        return await userLinksSqlc.listUserLinksByUserId(client, { userId });
    } catch (e: any) {
        if (e?.code === "22P02") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }
};

export const updateUserLink = async (
    client: Pool,
    userId: string,
    linkId: string | number | bigint,
    url: string
) => {
    let link;
    try {
        link = await userLinksSqlc.updateUserLink(client, {
            userId: userId,
            userLinkId: String(linkId),
            userLinkUrl: url
        });
    } catch (e: any) {
        if (e?.code === "23505") {
            throw UserErrors.error("user-link-already-exists").withDetails(e);
        }
        if (e?.code === "23514" || e?.code === "22P02" || e?.code === "22003" || e?.code === "22001") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!link) throw UserErrors.error("user-link-not-found");
    return link;
};

export const deleteUserLinkById = async (
    client: Pool,
    userId: string,
    linkId: string | number | bigint
) => {
    let deleted;
    try {
        deleted = await userLinksSqlc.deleteUserLink(client, { userId, userLinkId: String(linkId) });
    } catch (e: any) {
        if (e?.code === "22P02") {
            throw UserErrors.error("user-db-invalid-error").withDetails(e);
        }
        throw UserErrors.error("user-db-error").withDetails(e);
    }

    if (!deleted) throw UserErrors.error("user-link-not-found");
};