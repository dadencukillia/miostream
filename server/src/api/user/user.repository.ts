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
            INSERT INTO "User" (
                "nickname",
                "name",
                "email",
                "password_hash",
                "bio",
                "avatar_url",
                "social_networks",
                "profile_frame",
                "profile_background"
            ) VALUES (
                ${data.nickname},
                ${data.name},
                ${data.email},
                ${data.password_hash},
                ${data.bio ?? null},
                ${data.avatar_url ?? null},
                ${data.social_networks ?? []},
                ${data.profile_frame ?? 'DEFAULT'}::"ProfileFrame",
                ${data.profile_background ?? 'DEFAULT'}::"ProfileBackground"
            )
            RETURNING *;
        `;

        if (!user) {
            throw new Error("Failed to create user");
        }

        return user;
    }
    
    async getById(id : string) {
        const [user] = await this.prisma.$queryRaw<UserModel[]>`
            SELECT * 
            FROM "User" 
            WHERE "id" = ${id}::uuid
            LIMIT 1;
        `;

        if (!user) {
            throw new Error("Failed to get user user");
        }

        return user;
    }

    async update(id: string, data : UpdateUserInput){
        const [user] = await this.prisma.$queryRaw<UserModel[]>`
            UPDATE "User"
            SET 
                "nickname"           = COALESCE(${data.nickname ?? null}, "nickname"),
                "name"               = COALESCE(${data.name ?? null}, "name"),
                "email"              = COALESCE(${data.email ?? null}, "email"),
                "bio"                = COALESCE(${data.bio ?? null}, "bio"),
                "avatar_url"         = COALESCE(${data.avatar_url ?? null}, "avatar_url"),
                "social_networks"    = COALESCE(${data.social_networks ?? null}, "social_networks"),
                "profile_frame"      = COALESCE(${data.profile_frame ?? null}::"ProfileFrame", "profile_frame"),
                "profile_background" = COALESCE(${data.profile_background ?? null}::"ProfileBackground", "profile_background")
            WHERE "id" = ${id}::uuid
            RETURNING *;
        `;

        if (!user) {
            throw new Error("Failed to update user");
        }

        return user;
    }

    async delete(id : string){
        const affected = await this.prisma.$executeRaw`
            DELETE FROM "User"
            WHERE "id" = ${id}::uuid;
        `;

        if (affected === 0) {
            throw new Error("Failed to delete user");
        }
    }
}