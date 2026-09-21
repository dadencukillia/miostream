import prisma from '../../db';
import type { UserModel } from '@prisma/generated/models/User'
import type {
    CreateUserRepoInput,
    UpdateUserInput
} from "./user.dto";

export const createUser = async (
    data : CreateUserRepoInput
) => await prisma.$queryRaw<UserModel[]>`
    INSERT INTO "User" (
        "nickname",
        "name",
        "email",
        "password_hash",
        "bio",
        "avatar_url",
        "social_networks",
        "timezone",
        "last_action",
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
        ${data.timezone ?? 'UTC'},
        ${data.last_action ?? new Date()}::date,
        ${data.profile_frame ?? 'DEFAULT'}::"ProfileFrame",
        ${data.profile_background ?? 'DEFAULT'}::"ProfileBackground"
    )
    RETURNING *;
`;
    
export const getUserById = async (
    id : string
) => await prisma.$queryRaw<UserModel[]>`
    SELECT *
    FROM "User"
    WHERE "id" = ${id}::uuid
    LIMIT 1;
`;

export const getUserByEmail = async (
    email : string
) => await prisma.$queryRaw<UserModel[]>`
    SELECT * 
    FROM "User" 
    WHERE "email" = ${email}
    LIMIT 1;
`;

export const updateUser = async (
    id: string, 
    data : UpdateUserInput
) => await prisma.$queryRaw<UserModel[]>`
    UPDATE "User"
    SET 
        -- Update only if exists and not null
        "nickname"  = CASE WHEN ${data.nickname != null} THEN ${data.nickname} ELSE "nickname" END,
        "name"      = CASE WHEN ${data.name != null} THEN ${data.name} ELSE "name" END,
        "email"     = CASE WHEN ${data.email != null} THEN ${data.email} ELSE "email" END,
        "timezone"    = CASE WHEN ${data.timezone != null} THEN ${data.timezone} ELSE "timezone" END,
        "last_action" = CASE WHEN ${data.last_action != null} THEN ${data.last_action}::date ELSE "last_action" END,
        
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

export const deleteUser = async (
    id : string
) => await prisma.$executeRaw`
    DELETE FROM "User"
    WHERE "id" = ${id}::uuid;
`;