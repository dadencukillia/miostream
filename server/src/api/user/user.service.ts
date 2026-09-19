import type { UserModel } from '@prisma/generated/models/User'
import type { IUserRepository } from './user.repository';
import type { CreateUserInput } from './user.schema';

export class UserService {
    constructor(private readonly userRepo: IUserRepository) {}

    async registerUser( input: CreateUserInput): Promise<UserModel> {
        // a bunch of validations and repo calls
        return this.userRepo.create(input);
    }
}