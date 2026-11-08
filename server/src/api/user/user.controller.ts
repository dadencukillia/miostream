import type { FastifyRequest, FastifyReply } from "fastify";
import { UserInvalidError } from "./user.errors";
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
import * as services from "./user.service";
import { isSafeHttpUrl } from "@utils/urls";
import { isValidTimezone } from "@utils/timezones";

export const createUser = async (
    request: FastifyRequest<{ Body: CreateUserDto }>,
    reply: FastifyReply<{ Body: CreateUserDto; Reply: UserResponseDto }>
) => {
    // TODO(auth): take googleId/email from a verified Google ID token, not from body.
    const { password, googleId, timezone } = request.body;

    if (!password && !googleId) {
        throw new UserInvalidError('Either password or googleId must be provided for registration');
    }

    if (timezone && !isValidTimezone(timezone)) {
        throw new UserInvalidError(`Invalid IANA timezone: '${timezone}'`);
    }

    const user = await services.createUser(request.server.pg, request.body);
    return reply.status(201).send(user);
};

export const getUserById = async (
    request: FastifyRequest<{ Params: UserIdParamDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Reply: UserResponseDto }>
) => {
    const user = await services.getUserById(request.server.pg, request.params.userId);
    return reply.status(200).send(user);
};

export const deleteUser = async (
    request: FastifyRequest<{ Params: UserIdParamDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Reply: undefined }>
) => {
    // TODO(auth): revoke user sessions after deletion.
    // TODO(admin): forbid deleting the last admin.
    await services.deleteUserById(request.server.pg, request.params.userId);
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

    const user = await services.updateUserProfile(
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
    const { avatarId } = request.body;

    if (!isSafeHttpUrl(avatarId)) {
        throw new UserInvalidError('Avatar URL must use http or https protocol');
    }

    const user = await services.updateUserAvatar(
        request.server.pg,
        request.params.userId,
        avatarId
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

    const user = await services.updateUserCustomization(
        request.server.pg,
        request.params.userId,
        request.body
    );
    return reply.status(200).send(user);
};

export const updateUserPassword = async (
    request: FastifyRequest<{ Params: UserIdParamDto; Body: UpdateUserPasswordDto }>,
    reply: FastifyReply<{ Params: UserIdParamDto; Body: UpdateUserPasswordDto; Reply: undefined }>
) => {
    const { oldPassword, newPassword } = request.body;
    // TODO(auth): revoke all other sessions/tokens after password change.

    if (oldPassword === newPassword) {
        throw new UserInvalidError('New password must be different from the old password');
    }

    await services.updateUserPassword(
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
    // TODO(admin): forbid self-ban; revoke sessions on ban/deactivation;
    const user = await services.updateUserStatus(
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
    // TODO(admin): forbid self-demotion and removing the last admin;
    const user = await services.updateUserRole(
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

    const link = await services.createUserLink(
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
    const links = await services.listUserLinksByUserId(request.server.pg, request.params.userId);
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

    const link = await services.updateUserLink(
        request.server.pg,
        request.params.userId,
        request.params.userLinkId,
        userLinkUrl
    );
    return reply.status(200).send(link);
};

export const deleteUserLink = async (
    request: FastifyRequest<{ Params: UserLinkParamDto }>,
    reply: FastifyReply<{ Params: UserLinkParamDto; Reply: undefined }>
) => {
    await services.deleteUserLinkById(
        request.server.pg,
        request.params.userId,
        request.params.userLinkId
    );
    return reply.status(204).send();
};
