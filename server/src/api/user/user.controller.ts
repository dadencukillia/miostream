import type { FastifyRequest, FastifyReply } from 'fastify';
import { UserInvalidError } from './user.errors';
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

const isSafeHttpUrl = (urlString: string): boolean => {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const isValidTimezone = (timezone: string): boolean => {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
    } catch {
        return false;
    }
};

export const createUser = async (
    request: FastifyRequest<{ Body: CreateUserDto }>,
    reply: FastifyReply<{ Body: CreateUserDto; Reply: UserResponseDto }>
) => {
    const { password, googleId, timezone } = request.body;

    if (!password && !googleId) {
        throw new UserInvalidError('Either password or googleId must be provided for registration');
    }

    if (timezone && !isValidTimezone(timezone)) {
        throw new UserInvalidError(`Invalid IANA timezone: '${timezone}'`);
    }

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
    const { timezone, nickname, fullName } = request.body;

    if (!isValidTimezone(timezone)) {
        throw new UserInvalidError(`Invalid IANA timezone: '${timezone}'`);
    }

    if (nickname.trim().length === 0 || fullName.trim().length === 0) {
        throw new UserInvalidError('Nickname and full name cannot consist only of whitespace');
    }

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
    const { avatarUrl } = request.body;

    if (!isSafeHttpUrl(avatarUrl)) {
        throw new UserInvalidError('Avatar URL must use http or https protocol');
    }

    const user = await userService.updateUserAvatar(
        request.server.pg,
        request.params.userId,
        avatarUrl
    );
    return reply.status(200).send(user);
};

export const updateUserCustomization = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserCustomizationDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Body: UpdateUserCustomizationDto; Reply: UserResponseDto }>
) => {
    const { profileFrameUrl, profileBackgroundUrl } = request.body;

    if (profileFrameUrl === undefined && profileBackgroundUrl === undefined) {
        throw new UserInvalidError('At least one customization field must be specified');
    }

    if (profileFrameUrl && !isSafeHttpUrl(profileFrameUrl)) {
        throw new UserInvalidError('Profile frame URL must use http or https protocol');
    }

    if (profileBackgroundUrl && !isSafeHttpUrl(profileBackgroundUrl)) {
        throw new UserInvalidError('Profile background URL must use http or https protocol');
    }

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
    const { oldPassword, newPassword } = request.body;

    if (oldPassword === newPassword) {
        throw new UserInvalidError('New password must be different from the old password');
    }

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
    const { userLinkUrl } = request.body;

    if (!isSafeHttpUrl(userLinkUrl)) {
        throw new UserInvalidError('Link URL must use http or https protocol');
    }

    const link = await userService.createUserLink(
        request.server.pg,
        request.params.userId,
        userLinkUrl
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
    const { userLinkUrl } = request.body;

    if (!isSafeHttpUrl(userLinkUrl)) {
        throw new UserInvalidError('Link URL must use http or https protocol');
    }

    const link = await userService.updateUserLink(
        request.server.pg,
        request.params.userId,
        request.params.userLinkId,
        userLinkUrl
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