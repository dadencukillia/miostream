import type { FastifyRequest, FastifyReply } from 'fastify';
import type {
    UserIdParamDto,
    UserLinkParamDto,
    UserResponseDto,
    UserLinkResponseDto,
    UserLinkListResponseDto,
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
    reply: FastifyReply<{ Body: CreateUserDto; Reply: UserResponseDto }>
) => {
    const user = await userService.createUser(request.server.pg, request.body);
    return reply.status(201).send(user);
};

export const getUserById = async (
    request: FastifyRequest<{ Params: UserIdParamDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Reply: UserResponseDto }>
) => {
    const user = await userService.getUserById(request.server.pg, request.params.userId);
    return reply.status(200).send(user);
};

export const deleteUser = async (
    request: FastifyRequest<{ Params: UserIdParamDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Reply: void }>
) => {
    await userService.deleteUserById(request.server.pg, request.params.userId);
    return reply.status(204).send();
};

export const updateUserProfile = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserProfileDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Body: UpdateUserProfileDto; Reply: UserResponseDto }>
) => {
    const user = await userService.updateUserProfile(
        request.server.pg,
        request.params.userId,
        request.body
    );
    return reply.status(200).send(user);
};

export const updateUserAvatar = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserAvatarDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Body: UpdateUserAvatarDto; Reply: UserResponseDto }>
) => {
    const user = await userService.updateUserAvatar(
        request.server.pg,
        request.params.userId,
        request.body.avatarUrl
    );
    return reply.status(200).send(user);
};

export const updateUserCustomization = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserCustomizationDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Body: UpdateUserCustomizationDto; Reply: UserResponseDto }>
) => {
    const user = await userService.updateUserCustomization(
        request.server.pg,
        request.params.userId,
        request.body
    );
    return reply.status(200).send(user);
};

export const updateUserPassword = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserPasswordDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Body: UpdateUserPasswordDto; Reply: void }>
) => {
    await userService.updateUserPassword(
        request.server.pg,
        request.params.userId,
        request.body
    );
    return reply.status(204).send();
};

export const updateUserStatus = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserStatusDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Body: UpdateUserStatusDto; Reply: UserResponseDto }>
) => {
    const user = await userService.updateUserStatus(
        request.server.pg,
        request.params.userId,
        request.body.userStatus
    );
    return reply.status(200).send(user);
};

export const updateUserRole = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserRoleDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Body: UpdateUserRoleDto; Reply: UserResponseDto }>
) => {
    const user = await userService.updateUserRole(
        request.server.pg,
        request.params.userId,
        request.body.userRole
    );
    return reply.status(200).send(user);
};

export const createUserLink = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: CreateUserLinkDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Body: CreateUserLinkDto; Reply: UserLinkResponseDto }>
) => {
    const link = await userService.createUserLink(
        request.server.pg,
        request.params.userId,
        request.body.userLinkUrl
    );
    return reply.status(201).send(link);
};

export const listUserLinks = async (
    request: FastifyRequest<{ Params: UserIdParamDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Reply: UserLinkListResponseDto }>
) => {
    const links = await userService.listUserLinksByUserId(request.server.pg, request.params.userId);
    return reply.status(200).send(links);
};

export const updateUserLink = async (
    request: FastifyRequest<{ Params: UserLinkParamDto; Body: UpdateUserLinkDto }>,
    reply: FastifyReply<{ Params: UserLinkParamDto; Body: UpdateUserLinkDto; Reply: UserLinkResponseDto }>
) => {
    const link = await userService.updateUserLink(
        request.server.pg,
        request.params.userId,
        request.params.userLinkId,
        request.body.userLinkUrl
    );
    return reply.status(200).send(link);
};

export const deleteUserLink = async (
    request: FastifyRequest<{ Params: UserLinkParamDto }>,
    reply: FastifyReply<{ Params: UserLinkParamDto; Reply: void }>
) => {
    await userService.deleteUserLinkById(
        request.server.pg,
        request.params.userId,
        request.params.userLinkId
    );
    return reply.status(204).send();
};