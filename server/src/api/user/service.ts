import * as userRepo from "./repository";
import type { UserModel } from "@prisma/generated/models/User";
import type { CreateUserInput, UpdateUserInput } from "./dto";
import {
    UserError,
    UserInvalidError,
    UserNotFoundError,
    UserAlreadyExistsError
} from "./errors";

const toUserModel = <T extends { social_networks: string[] | null }>(
    user: T
): T & { social_networks: string[] } => ({
    ...user,
    social_networks: user.social_networks ?? [],
});

export const createUser = async (data: CreateUserInput): Promise<UserModel> => {
    if (!data.password || data.password.length < 8) {
        throw new UserInvalidError("Password must be at least 8 characters");
    }

    const password_hash = "hashed_" + data.password; // TODO: replace mockup onto the real hashing operation

    const [user] = await userRepo.createUser({
        nickname: data.nickname,
        name: data.name,
        email: data.email,
        password_hash,
    });

    if (!user) throw new UserError("Failed to create user"); // TODO: error causation should be more precise

    return toUserModel(user) as UserModel;
};

export const getUserById = async (id: string): Promise<UserModel> => {
    if (!id?.trim()) throw new UserInvalidError('User ID must be a non-empty string');

    const [user] = await userRepo.getUserById(id);
    if (!user) throw new UserNotFoundError(`User with id '${id}' not found`);

    return toUserModel(user) as UserModel;
};

export const updateUser = async (
    id: string,
    data: UpdateUserInput
): Promise<UserModel> => {
    if (!id?.trim()) throw new UserInvalidError('User ID must be a non-empty string');
    if (!data || Object.keys(data).length === 0) {
        throw new UserInvalidError("Update payload cannot be empty");
    }

    const [user] = await userRepo.updateUser(id, data);
    if (!user) throw new UserError(`User was not updated`); // TODO: error causation should be more precise

    return toUserModel(user) as UserModel;
};

export const deleteUser = async (id: string): Promise<void> => {
    if (!id?.trim()) throw new UserInvalidError('User ID must be a non-empty string');

    const deleted = await userRepo.deleteUser(id);
    if (!deleted || deleted.length === 0) {
        throw new UserError("User not found or could not be deleted"); // TODO: error causation should be more precise
    }
};