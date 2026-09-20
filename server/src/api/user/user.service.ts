import type { UserModel } from '@prisma/generated/models/User'
import type { IUserRepository } from './user.repository';
import type { CreateUserInput, CreateUserRepoInput, UpdateUserInput } from './user.schema';

export class UserService {
    constructor(private readonly userRepo: IUserRepository) {}

    async create( input: CreateUserInput ): Promise<UserModel> {
        // TODO: add a bunch of validations and repo calls
        const { password, ...input_without_password } = input;

        const password_hash = 'password'; // TODO: add password hashing logic

        const data: CreateUserRepoInput = { ...input_without_password, password_hash}

        return this.userRepo.create(data);
    }

    async getById( id: string ): Promise<UserModel> {
        // TODO: add a bunch of validations and repo calls
        return this.userRepo.getById(id);
    }

    async update( id: string, input: UpdateUserInput ): Promise<UserModel> {
        // TODO: add a bunch of validations and repo calls
        return this.userRepo.update(id, input);
    }

    async delete( id: string ): Promise<void> {
        // TODO: add a bunch of validations and repo calls
        await this.userRepo.delete(id);
    }
}