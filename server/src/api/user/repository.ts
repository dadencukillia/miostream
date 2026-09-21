import prisma from '../../db';
import type {
    CreateUserRepoInput,
    UpdateUserInput
} from "./dto";
import {
    insertNewUser,
    selectUserById,
    patchUserById,
    deleteUserById
} from '@prisma/generated/sql'

export const createUser = async (
    data: CreateUserRepoInput
) => await prisma.$queryRawTyped(
    insertNewUser(
        data.nickname,
        data.name,
        data.email,
        data.password_hash
    )
);

export const getUserById = async (
    id: string
) => await prisma.$queryRawTyped(selectUserById(id));

export const updateUser = async (
    id: string,
    data: UpdateUserInput
) => await prisma.$queryRawTyped(patchUserById(id, data));

export const deleteUser = async (
    id: string
) => await prisma.$queryRawTyped(deleteUserById(id))