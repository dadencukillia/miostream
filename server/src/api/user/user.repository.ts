import type { PrismaClient } from "@prisma/generated/client";
import type { UserModel } from '@prisma/generated/models/User'
import type {
    CreateUserRepoInput,
    UpdateUserInput
} from "./user.schema";

export interface IUserRepository {
    create  (data: CreateUserRepoInput): Promise<UserModel>;
    getById (id : string): Promise<UserModel>;
    update  (id : string, data: UpdateUserInput): Promise<UserModel>;
    delete  (id : string): Promise<void>;
}

export class UserRepository implements IUserRepository{
    constructor(private readonly prisma: PrismaClient) {}

    async create(data : CreateUserRepoInput) {
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
            // TODO: add good error throwers with codes
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
            // TODO: add good error throwers with codes
            throw new Error("Failed to get user");
        }

        return user;
    }

    async update(id: string, data : UpdateUserInput){
        const [user] = await this.prisma.$queryRaw<UserModel[]>`
            UPDATE "User"
            SET 
                -- Update only if exists and not null
                "nickname"  = CASE WHEN ${data.nickname != null} THEN ${data.nickname} ELSE "nickname" END,
                "name"      = CASE WHEN ${data.name != null} THEN ${data.name} ELSE "name" END,
                "email"     = CASE WHEN ${data.email != null} THEN ${data.email} ELSE "email" END,
                
                -- Update only if exists
                "bio"             = CASE WHEN ${data.bio !== undefined} THEN ${data.bio ?? null} ELSE "bio" END,
                "avatar_url"      = CASE WHEN ${data.avatar_url !== undefined} THEN ${data.avatar_url ?? null} ELSE "avatar_url" END,
                "social_networks" = CASE WHEN ${data.social_networks !== undefined} THEN ${data.social_networks ?? null} ELSE "social_networks" END,
                
                -- Update only if exists, set default if null
                "profile_frame" = CASE 
                    WHEN ${data.profile_frame === undefined} THEN "profile_frame"
                    WHEN ${data.profile_frame === null} THEN 'DEFAULT'::"ProfileFrame"
                    ELSE ${data.profile_frame ?? null}::"ProfileFrame"
                END,
                "profile_background" = CASE 
                    WHEN ${data.profile_background === undefined} THEN "profile_background"
                    WHEN ${data.profile_background === null} THEN 'DEFAULT'::"ProfileBackground"
                    ELSE ${data.profile_background ?? null}::"ProfileBackground"
                END,

                -- Update every time, but only to default
                "updated_at" = NOW()

            WHERE "id" = ${id}::uuid
            RETURNING *;
        `;

        if (!user) {
            // TODO: add good error throwers with codes
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
            // TODO: add good error throwers with codes
            throw new Error("Failed to delete user");
        }
    }
}