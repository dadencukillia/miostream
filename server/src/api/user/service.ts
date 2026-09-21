import type { UserModel } from '@prisma/generated/models/User'
import * as userRepo from './repository';
import type {
    CreateUserInput,
    CreateUserRepoInput,
    UpdateUserInput
} from './dto';
import {
    UserError,
    UserNotFoundError,
    UserInvalidError,
    UserAlreadyExistsError
} from './errors'

export const createUser = async (input: CreateUserInput): Promise<UserModel> => {
    if (!input.password || input.password.length < 8) {
        throw new UserInvalidError('Password must be at least 8 characters long');
    }

    const { password, ...inputWithoutPassword } = input;
    const password_hash = 'hashedPassword'; // TODO: replace mockup onto the real hashing operation
    const data: CreateUserRepoInput = { ...inputWithoutPassword, password_hash }

    const [user] = await userRepo.createUser(data);

    if (!user) throw new UserError(`User was not created`) // TODO: error causation should be more precise

    return user;
}

export const getUserById = async (id: string): Promise<UserModel> => {
    if (!id?.trim()) throw new UserInvalidError('User ID must be a non-empty string');

    const [user] = await userRepo.getUserById(id);
    if (!user) throw new UserNotFoundError(`User with id '${id}' not found`);

    return user;
}

export const updateUser = async (id: string, input: UpdateUserInput): Promise<UserModel> => {
    if (!id?.trim()) throw new UserInvalidError('User ID must be a non-empty string');
    if (Object.keys(input).length === 0) {
        throw new UserInvalidError('Update payload cannot be empty')
    };

    const [user] = await userRepo.updateUser(id, input);
    if (!user) throw new UserError(`User was not updated`); // TODO: error causation should be more precise
    return user;
}

export const deleteUser = async (id: string): Promise<void> => {
    if (!id?.trim()) throw new UserInvalidError('User ID must be a non-empty string');

    const deleted = await userRepo.deleteUser(id);
    if (!deleted) throw new UserError(`User was not deleted`); // TODO: error causation should be more precise
}