import type { UserModel } from '@prisma/generated/models/User'
import type { IUserRepository } from './user.repository';
import type { CreateUserInput, UpdateUserInput } from './user.schema';

export class UserService {
    constructor(private readonly userRepo: IUserRepository) {}

    async create( input: CreateUserInput ): Promise<UserModel> {
        // TODO: add a bunch of validations and repo calls
        return this.userRepo.create(input);
    }

    async getById( id: string ): Promise<UserModel> {
        // TODO: add a bunch of validations and repo calls
        return this.userRepo.getById(id);
    }

    async update( id: string, input: UpdateUserInput ): Promise<UserModel> {
        // TODO: add a bunch of validations and repo calls
        return this.userRepo.update(id, input);
    }

    async delete( id: string ) {
        // TODO: add a bunch of validations and repo calls
        this.userRepo.delete(id);
    }
}