import { ProfileFrame, ProfileBackground } from "@prisma/generated/client";

export interface UserParams {
    id: string;
}

export interface CreateUserRequest {
    nickname: string;
    name: string;
    email: string;
    password: string;
}

export type UpdateUserRequest = {
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
