import type { FastifyRequest, FastifyReply } from "fastify";
import { UserErrors } from "./user.errors";
import * as dto from "./user.dto";
import * as services from "./services/user.service";
import * as avatarServices from "./services/avatar.service";
import { isSafeHttpUrl } from "@utils/urls";
import { isValidTimezone } from "@utils/timezones";

export const createUser = async (
    request: FastifyRequest<{ Body: dto.CreateUserRequestPayloadType }>,
    reply: FastifyReply<{ Body: dto.CreateUserRequestPayloadType; Reply: dto.CreateUserReturnType }>
) => {
    // TODO(auth): take googleId/email from a verified Google ID token, not from body.
    const { password, googleId, timezone } = request.body;

    if (!password && !googleId) throw UserErrors.error("user-invalid");
    if (timezone && !isValidTimezone(timezone)) throw UserErrors.error("user-invalid");

    const user = await services.createUser(request.server.pg, request.body);
    return reply.status(201).send(user);
};

export const getUserById = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Reply: dto.GetUserByIdReturnType }>
) => {
    const user = await services.getUserById(request.server.pg, request.params.userId);
    return reply.status(200).send(user);
};

export const deleteUser = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Reply: dto.DeleteUserReturnType }>
) => {
    // TODO(auth): revoke user sessions after deletion.
    // TODO(admin): forbid deleting the last admin.
    await services.deleteUserById(request.server.pg, request.params.userId);
    return reply.status(204).send(null);
};

export const updateUserProfile = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserProfileRequestPayloadType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserProfileRequestPayloadType; Reply: dto.UpdateUserProfileReturnType }>
) => {
    const { timezone, nickname, fullName } = request.body;

    if (!isValidTimezone(timezone)) throw UserErrors.error("user-invalid");
    if (nickname.trim().length === 0 || fullName.trim().length === 0) throw UserErrors.error("user-invalid");

    const user = await services.updateUserProfile(
        request.server.pg,
        request.params.userId,
        request.body
    );
    return reply.status(200).send(user);
};

export const updateUserAvatar = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserAvatarRequestPayloadType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserAvatarRequestPayloadType; Reply: dto.UpdateUserAvatarReturnType }>
) => {
    const user = await avatarServices.updateUserAvatarImage(
        request.server.s3,
        request.server.pg,
        request.log,
        request.params.userId,
        Buffer.from(request.body, "base64")
    );
    return reply.status(200).send(user);
};

export const deleteUserAvatar = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Reply: dto.DeleteUserAvatarReturnType }>
) => {
    await avatarServices.resetUserAvatar(
        request.server.s3,
        request.server.pg,
        request.log,
        request.params.userId
    );
    return reply.status(204).send(null);
};

export const updateUserCustomization = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserCustomizationRequestPayloadType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserCustomizationRequestPayloadType; Reply: dto.UpdateUserCustomizationReturnType }>
) => {
    const { profileFrameUrl, profileBackgroundUrl } = request.body;

    if (profileFrameUrl === undefined && profileBackgroundUrl === undefined) throw UserErrors.error("user-invalid");
    if (profileFrameUrl && !isSafeHttpUrl(profileFrameUrl)) throw UserErrors.error("user-invalid");
    if (profileBackgroundUrl && !isSafeHttpUrl(profileBackgroundUrl)) throw UserErrors.error("user-invalid");

    const user = await services.updateUserCustomization(
        request.server.pg,
        request.params.userId,
        request.body
    );
    return reply.status(200).send(user);
};

export const updateUserPassword = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserPasswordRequestPayloadType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserPasswordRequestPayloadType; Reply: dto.UpdateUserPasswordReturnType }>
) => {
    const { oldPassword, newPassword } = request.body;
    // TODO(auth): revoke all other sessions/tokens after password change.
    if (oldPassword === newPassword) throw UserErrors.error("user-invalid");

    await services.updateUserPassword(
        request.server.pg,
        request.params.userId,
        request.body
    );
    return reply.status(204).send(null);
};

export const updateUserStatus = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserStatusRequestPayloadType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserStatusRequestPayloadType; Reply: dto.UpdateUserStatusReturnType }>
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
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserRoleRequestPayloadType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserRoleRequestPayloadType; Reply: dto.UpdateUserRoleReturnType }>
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
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType; Body: dto.CreateUserLinkRequestPayloadType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Body: dto.CreateUserLinkRequestPayloadType; Reply: dto.CreateUserLinkReturnType }>
) => {
    const { userLinkUrl } = request.body;

    if (!isSafeHttpUrl(userLinkUrl)) throw UserErrors.error("user-invalid");

    const link = await services.createUserLink(
        request.server.pg,
        request.params.userId,
        userLinkUrl
    );
    return reply.status(201).send(link);
};

export const listUserLinks = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Reply: dto.ListUserLinksReturnType }>
) => {
    const links = await services.listUserLinksByUserId(request.server.pg, request.params.userId);
    return reply.status(200).send(links);
};

export const updateUserLink = async (
    request: FastifyRequest<{ Params: dto.UserLinkRequestParamsType; Body: dto.UpdateUserLinkRequestPayloadType }>,
    reply: FastifyReply<{ Params: dto.UserLinkRequestParamsType; Body: dto.UpdateUserLinkRequestPayloadType; Reply: dto.UpdateUserLinkReturnType }>
) => {
    const { userLinkUrl } = request.body;

    if (!isSafeHttpUrl(userLinkUrl)) throw UserErrors.error("user-invalid");

    const link = await services.updateUserLink(
        request.server.pg,
        request.params.userId,
        request.params.userLinkId,
        userLinkUrl
    );
    return reply.status(200).send(link);
};

export const deleteUserLink = async (
    request: FastifyRequest<{ Params: dto.UserLinkRequestParamsType }>,
    reply: FastifyReply<{ Params: dto.UserLinkRequestParamsType; Reply: dto.DeleteUserLinkReturnType }>
) => {
    await services.deleteUserLinkById(
        request.server.pg,
        request.params.userId,
        request.params.userLinkId
    );
    return reply.status(204).send(null);
};
