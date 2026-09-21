import { ProfileFrame, ProfileBackground } from "@prisma/generated/client";

export interface UserParams {
    id: string;
}

export interface CreateUserInput {
    nickname: string;
    name: string;
    email: string;
    password: string;
}

export type CreateUserRepoInput = Omit<CreateUserInput, 'password'> & { password_hash: string; };

export type UpdateUserInput = {
    nickname?: string;
    name?: string;
    email?: string;
    bio?: string;
    avatar_url?: string;
    social_networks?: string[];
    timezone?: string;
    last_action?: string;
    profile_frame?: ProfileFrame;
    profile_background?: ProfileBackground;
}
