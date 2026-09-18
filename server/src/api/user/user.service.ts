import prisma from "../../db";
class UserService {
    async create( payload: {
        email: string;
        password_hash: string;
        nickname?: string;
        name?: string;
        bio?: string;
        avatar_url?: string;
        social_networks?: string[];
    }) {
        const result = prisma.$queryRaw``; // sql
        return result;
    }
    async getById(){
        const result = prisma.$queryRaw``; // sql
        return result;
    }
    async update(){
        const result = prisma.$queryRaw``; // sql
        return result;
    }
    async delete(){
        const result = prisma.$queryRaw``; // sql
        return result;
    }
}

export const userService = new UserService();