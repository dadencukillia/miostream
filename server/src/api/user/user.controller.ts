import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
    UserIdParamDto,
    UserLinkParamDto,
    CreateUserDto,
    UpdateUserProfileDto,
    UpdateUserAvatarDto,
    UpdateUserCustomizationDto,
    UpdateUserPasswordDto,
    UpdateUserStatusDto,
    UpdateUserRoleDto,
    CreateUserLinkDto,
    UpdateUserLinkDto
} from './user.schema';
import * as userService from './user.service';

export const createUser = async (
    request: FastifyRequest<{ Body: CreateUserDto }>,
    reply: FastifyReply
) => {
    const user = await userService.createUser(request.server.pg, request.body);
    return reply.status(201).send(user);
};

export const getUserById = async (
    request: FastifyRequest<{ Params: UserIdParamDto }>,
    reply: FastifyReply
) => {
    const user = await userService.getUserById(request.server.pg, request.params.user_id);
    return reply.status(200).send(user);
};

export const deleteUser = async (
    request: FastifyRequest<{ Params: UserIdParamDto }>,
    reply: FastifyReply
) => {
    await userService.deleteUserById(request.server.pg, request.params.user_id);
    return reply.status(204).send();
};

export const updateUserProfile = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserProfileDto }>,
    reply: FastifyReply
) => {
    const user = await userService.updateUserProfile(
        request.server.pg,
        request.params.user_id,
        request.body
    );
    return reply.status(200).send(user);
};

export const updateUserAvatar = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserAvatarDto }>,
    reply: FastifyReply
) => {
    const user = await userService.updateUserAvatar(
        request.server.pg,
        request.params.user_id,
        request.body.avatar_url
    );
    return reply.status(200).send(user);
};

export const updateUserCustomization = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserCustomizationDto }>,
    reply: FastifyReply
) => {
    const user = await userService.updateUserCustomization(
        request.server.pg,
        request.params.user_id,
        request.body
    );
    return reply.status(200).send(user);
};

export const updateUserPassword = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserPasswordDto }>,
    reply: FastifyReply
) => {
    await userService.updateUserPassword(
        request.server.pg,
        request.params.user_id,
        request.body
    );
    return reply.status(204).send();
};

export const updateUserStatus = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserStatusDto }>,
    reply: FastifyReply
) => {
    const user = await userService.updateUserStatus(
        request.server.pg,
        request.params.user_id,
        request.body.user_status
    );
    return reply.status(200).send(user);
};

export const updateUserRole = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserRoleDto }>,
    reply: FastifyReply
) => {
    const user = await userService.updateUserRole(
        request.server.pg,
        request.params.user_id,
        request.body.user_role
    );
    return reply.status(200).send(user);
};

export const createUserLink = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: CreateUserLinkDto }>,
    reply: FastifyReply
) => {
    const link = await userService.createUserLink(
        request.server.pg,
        request.params.user_id,
        request.body.user_link_url
    );
    return reply.status(201).send(link);
};

export const listUserLinks = async (
    request: FastifyRequest<{ Params: UserIdParamDto }>,
    reply: FastifyReply
) => {
    const links = await userService.listUserLinksByUserId(request.server.pg, request.params.user_id);
    return reply.status(200).send(links);
};

export const updateUserLink = async (
    request: FastifyRequest<{ Params: UserLinkParamDto; Body: UpdateUserLinkDto }>,
    reply: FastifyReply
) => {
    const link = await userService.updateUserLink(
        request.server.pg,
        request.params.user_id,
        request.params.user_link_id,
        request.body.user_link_url
    );
    return reply.status(200).send(link);
};

export const deleteUserLink = async (
    request: FastifyRequest<{ Params: UserLinkParamDto }>,
    reply: FastifyReply
) => {
    await userService.deleteUserLinkById(
        request.server.pg,
        request.params.user_id,
        request.params.user_link_id
    );
    return reply.status(204).send();
};