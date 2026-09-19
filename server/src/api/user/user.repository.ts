import type { PrismaClient } from "@prisma/generated/client";
import type { UserModel } from '@prisma/generated/models/User'
import type {
    CreateUserInput,
    UpdateUserInput
} from "./user.schema";

export interface IUserRepository {
    create  (data: CreateUserInput): Promise<UserModel>;
    getById (id : string): Promise<UserModel>;
    update  (id : string, data: UpdateUserInput): Promise<UserModel>;
    delete  (id : string): Promise<void>;
}

export class UserRepository implements IUserRepository{
    constructor(private readonly prisma: PrismaClient) {}

    async create(data : CreateUserInput) {
        const [user] = await this.prisma.$queryRaw<UserModel[]>`
            -- place to insert sql
        `;

        if (!user) {
            throw new Error("Failed to create user");
        }

        return user;
    }
    
    async getById(id : string) {
        const [user] = await this.prisma.$queryRaw<UserModel[]>`
            -- place to insert sql
        `;

        if (!user) {
            throw new Error("Failed to get user user");
        }

        return user;
    }

    async update(id: string, data : UpdateUserInput){
         const [user] = await this.prisma.$queryRaw<UserModel[]>`
            -- place to insert sql
        `;

        if (!user) {
            throw new Error("Failed to update user");
        }

        return user;
    }

    async delete(id : string){
        const affected = await this.prisma.$executeRaw`
            -- place to insert sql
        `;

        if (affected === 0) {
            throw new Error("Failed to delete user");
        }
    }
}