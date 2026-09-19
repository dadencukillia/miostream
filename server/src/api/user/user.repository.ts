import type { PrismaClient } from "@prisma/generated/client";
import type { UserModel } from '@prisma/generated/models/User'
import type { CreateUserInput } from "./user.schema";

export interface IUserRepository {
    create(data: CreateUserInput): Promise<UserModel>
}

export class UserRepository implements IUserRepository{
    constructor(private readonly prisma: PrismaClient) {}

    async create(data : CreateUserInput) {
        const user = await this.prisma.$queryRaw<UserModel>`
            -- place to insert sql
        `;

        if (!user) {
            throw new Error("Failed to create user");
        }

        return user;
    }
}