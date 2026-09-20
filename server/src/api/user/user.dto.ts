import { ProfileFrame, ProfileBackground } from "@prisma/generated/client";

export interface UserParams {
    id: string;
}

export interface CreateUserInput {
    nickname: string;
    name: string;
    email: string;
    password: string;
    bio?: string;
    avatar_url?: string;
    social_networks?: string[];
    profile_frame?: ProfileFrame;
    profile_background?: ProfileBackground;
}

export type CreateUserRepoInput = 
    Partial<Omit<CreateUserInput, 'password'>> & { password_hash: string; };

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'password'>>;