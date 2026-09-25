import prisma from '../../db';
import type {
    CreateUserRequest,
    UpdateUserRequest
} from "./dto";
import {
    insertNewUser,
    selectUserById,
    patchUserById,
    deleteUserById
} from '@prisma/generated/sql'

export type ICreateUser = Omit<CreateUserRequest, 'password'>
    & { password_hash: string; };
export type IUpdateUser = UpdateUserRequest;

export const createUser = async (
    data: ICreateUser
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
    data: IUpdateUser
) => await prisma.$queryRawTyped(patchUserById(id, data));

export const deleteUser = async (
    id: string
) => await prisma.$queryRawTyped(deleteUserById(id))