import * as userRepo from "./repository";
import type { UserModel } from "@prisma/generated/models/User";
import type { CreateUserInput, UpdateUserInput } from "./dto";
import {
    UserError,
    UserInvalidError,
    UserNotFoundError,
    UserAlreadyExistsError,
} from "./errors";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NICKNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toUserModel = <T extends { social_networks: string[] | null }>(
    user: T
): T & { social_networks: string[] } => ({
    ...user,
    social_networks: user.social_networks ?? [],
});

const handleDbError = (err: any): never => {
    if (err?.code === "23505" || err?.message?.includes("23505")) {
        const detail = String(err?.detail ?? err?.message ?? "");
        if (detail.includes("nickname")) throw new UserAlreadyExistsError("A user with this nickname already exists");
        if (detail.includes("email")) throw new UserAlreadyExistsError("A user with this email already exists");
        throw new UserAlreadyExistsError("User already exists with conflicting unique fields");
    }
    if (err?.code === "22P02" || err?.message?.includes("22P02")) throw new UserInvalidError("Invalid data format or enum value provided");
    if (err?.code === "22001" || err?.message?.includes("22001")) throw new UserInvalidError("Field value exceeds maximum allowed length");
    if (err?.code === "22007" || err?.message?.includes("22007")) throw new UserInvalidError("Invalid date format provided");
    throw err;
};

export const createUser = async (data: CreateUserInput): Promise<UserModel> => {
    if (!data.password || data.password.length < 8) throw new UserInvalidError("Password must be at least 8 characters");
    if (data.password.length > 128) throw new UserInvalidError("Password must not exceed 128 characters");
    if (!data.nickname?.trim()) throw new UserInvalidError("Nickname is required");
    if (!NICKNAME_REGEX.test(data.nickname)) throw new UserInvalidError("Nickname must be 3-30 characters containing only letters, numbers, and underscores");
    if (!data.name?.trim()) throw new UserInvalidError("Name is required");
    if (data.name.length < 3 || data.name.length > 100) throw new UserInvalidError("Name must be between 3 and 100 characters");
    if (!data.email?.trim()) throw new UserInvalidError("Email is required");
    if (!EMAIL_REGEX.test(data.email)) throw new UserInvalidError("Invalid email format");

    const password_hash = "hashed_" + data.password;

    const [user] = await userRepo.createUser({
        nickname: data.nickname,
        name: data.name,
        email: data.email,
        password_hash,
    }).catch(handleDbError);

    if (!user) throw new UserError("Failed to create user");

    return toUserModel(user) as UserModel;
};

export const getUserById = async (id: string): Promise<UserModel> => {
    if (!id?.trim()) throw new UserInvalidError("User ID must be a non-empty string");
    if (!UUID_REGEX.test(id)) throw new UserInvalidError("User ID must be a valid UUID");

    const [user] = await userRepo.getUserById(id).catch(handleDbError);
    if (!user) throw new UserNotFoundError(`User with id '${id}' not found`);

    return toUserModel(user) as UserModel;
};

export const updateUser = async (
    id: string,
    data: UpdateUserInput
): Promise<UserModel> => {
    if (!id?.trim()) throw new UserInvalidError("User ID must be a non-empty string");
    if (!UUID_REGEX.test(id)) throw new UserInvalidError("User ID must be a valid UUID");
    if (!data || Object.keys(data).length === 0) throw new UserInvalidError("Update payload cannot be empty");

    if (data.nickname !== undefined && !NICKNAME_REGEX.test(data.nickname)) throw new UserInvalidError("Nickname must be 3-30 characters containing only letters, numbers, and underscores");
    if (data.name !== undefined && (data.name.length < 3 || data.name.length > 100)) throw new UserInvalidError("Name must be between 3 and 100 characters");
    if (data.email !== undefined && !EMAIL_REGEX.test(data.email)) throw new UserInvalidError("Invalid email format");
    if (data.last_action !== undefined && isNaN(Date.parse(data.last_action))) throw new UserInvalidError("Invalid date format for last_action");
    if (data.social_networks !== undefined && !Array.isArray(data.social_networks)) throw new UserInvalidError("social_networks must be an array");

    const [user] = await userRepo.updateUser(id, data).catch(handleDbError);
    if (!user) throw new UserError("User was not updated");

    return toUserModel(user) as UserModel;
};

export const deleteUser = async (id: string): Promise<void> => {
    if (!id?.trim()) throw new UserInvalidError("User ID must be a non-empty string");
    if (!UUID_REGEX.test(id)) throw new UserInvalidError("User ID must be a valid UUID");

    const deleted = await userRepo.deleteUser(id).catch(handleDbError);
    if (!deleted || deleted.length === 0) throw new UserError("User not found or could not be deleted");
};