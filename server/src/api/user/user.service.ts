import type { UserModel } from '@prisma/generated/models/User'
import type { IUserRepository } from './user.repository';
import type {
    CreateUserInput,
    CreateUserRepoInput,
    UpdateUserInput
} from './user.dto';
import {
    UserError,
    UserNotFoundError,
    UserInvalidError,
    UserAlreadyExistsError
} from './user.errors'

export class UserService {
    constructor(private readonly userRepo: IUserRepository) {}

    async create( input: CreateUserInput ): Promise<UserModel> {
        if (!input.password || input.password.length < 8) {
            throw new UserInvalidError('Password must be at least 8 characters long');
        }

        const { password, ...inputWithoutPassword } = input;
        const password_hash = 'hashedPassword'; // TODO: replace mockup onto the real hashing operation
        const data: CreateUserRepoInput = { ...inputWithoutPassword, password_hash}

        try{
            const newUser = await this.userRepo.create(data);
            return newUser;
        } catch (error) {
            if (error instanceof UserError) throw error;
            throw new UserError(`Failed to create user: ${(error as Error).message}`);
        }
    }

    async getById( id: string ): Promise<UserModel> {
        if (!id?.trim()) throw new UserInvalidError('User ID must be a non-empty string');

        const user = await this.userRepo.getById(id);
        if (!user) throw new UserNotFoundError(`User with id '${id}' not found`);

        return user;
    }

    async update( id: string, input: UpdateUserInput ): Promise<UserModel> {
        if (!id?.trim()) throw new UserInvalidError('User ID must be a non-empty string');
        if (Object.keys(input).length === 0) {
            throw new UserInvalidError('Update payload cannot be empty')
        };
        
        const user = await this.userRepo.getById(id);
        if (!user) throw new UserNotFoundError(`User with id '${id}' not found`);

        try {
            const updatedUser = await this.userRepo.update(id, input);
            if (!updatedUser) throw new UserNotFoundError(`User with id '${id}' not found`);
            return updatedUser;
        } catch (error) {
            if (error instanceof UserError) throw error;
            throw new UserError(`Failed to update user: ${(error as Error).message}`);
        }
    }

    async delete( id: string ): Promise<void> {
        if (!id?.trim()) throw new UserInvalidError('User ID must be a non-empty string');

        const user = await this.userRepo.getById(id);
        if (!user) throw new UserNotFoundError(`User with id '${id}' not found`);

        try {
            const deleted = await this.userRepo.delete(id);
            if (!deleted) throw new UserNotFoundError(`User with id '${id}' not found`);
        } catch (error) {
            if (error instanceof UserError) throw error;
            throw new UserError(`Failed to delete user: ${(error as Error).message}`);
        }
    }
}