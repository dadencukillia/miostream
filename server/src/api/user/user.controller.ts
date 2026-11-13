import type { FastifyRequest, FastifyReply } from "fastify";
import { UserErrors } from "./user.errors";
import * as dto from "./user.dto";
import * as services from "./services/user.service";
import * as avatarServices from "./services/avatar.service";
import { isSafeHttpUrl } from "@utils/urls";
import { isValidTimezone } from "@utils/timezones";
import { isUuid, normalizeUuid } from "@utils/uuid";
import { isReservedNickname } from "@utils/nickname";
import { toPublicUserModel } from "./user.model";

export const createUser = async (
    request: FastifyRequest<{ Body: dto.CreateUserRequestPayloadType }>,
    reply: FastifyReply<{ Body: dto.CreateUserRequestPayloadType; Reply: dto.CreateUserReturnType }>
) => {
    // TODO(auth): take googleId/email from a verified Google ID token, not from body.
    const { password, googleId, timezone, nickname } = request.body;

    if (!password && !googleId) throw UserErrors.error("user-invalid");
    if (timezone && !isValidTimezone(timezone)) throw UserErrors.error("user-invalid");
    if (isUuid(nickname) || isReservedNickname(nickname)) throw UserErrors.error("user-invalid");

    const user = await services.createUser(request.server.pg, request.body);
    return reply.status(201).send(user);
};

export const getUser = async (
    request: FastifyRequest<{ Params: dto.UserIdentifierRequestParamsType }>,
    reply: FastifyReply<{ Params: dto.UserIdentifierRequestParamsType; Reply: dto.GetUserReturnType }>
) => {
    const { identifier } = request.params;

    const user = isUuid(identifier)
        ? await services.getUserById(request.server.pg, normalizeUuid(identifier)!)
        : await services.getUserByNickname(request.server.pg, identifier);

    return reply.status(200).send(toPublicUserModel(user));
};

export const deleteUser = async (
    request: FastifyRequest<{}>,
    reply: FastifyReply<{ Reply: dto.DeleteUserReturnType }>
) => {
    await services.deleteUserById(request.server.pg, request.auth!.userId);
    return reply.status(204).send(null);
};

export const deleteUserById = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Reply: dto.DeleteUserByIdReturnType }>
) => {
    await services.deleteUserById(request.server.pg, request.params.userId);
    return reply.status(204).send(null);
};

export const updateUserProfile = async (
    request: FastifyRequest<{ Body: dto.UpdateUserProfileRequestPayloadType }>,
    reply: FastifyReply<{ Body: dto.UpdateUserProfileRequestPayloadType; Reply: dto.UpdateUserProfileReturnType }>
) => {
    const { timezone, nickname, fullName } = request.body;

    if (!isValidTimezone(timezone)) throw UserErrors.error("user-invalid");
    if (nickname.trim().length === 0 || fullName.trim().length === 0) throw UserErrors.error("user-invalid");
    if (isUuid(nickname) || isReservedNickname(nickname)) throw UserErrors.error("user-invalid");

    const user = await services.updateUserProfile(
        request.server.pg,
        request.auth!.userId,
        request.body
    );
    return reply.status(200).send(user);
};

export const updateUserAvatar = async (
    request: FastifyRequest<{ Body: dto.UpdateUserAvatarRequestPayloadType }>,
    reply: FastifyReply<{ Body: dto.UpdateUserAvatarRequestPayloadType; Reply: dto.UpdateUserAvatarReturnType }>
) => {
    const user = await avatarServices.updateUserAvatarImage(
        request.server.s3,
        request.server.pg,
        request.log,
        request.auth!.userId,
        Buffer.from(request.body, "base64")
    );
    return reply.status(200).send(user);
};

export const deleteUserAvatar = async (
    request: FastifyRequest<{}>,
    reply: FastifyReply<{ Reply: dto.DeleteUserAvatarReturnType }>
) => {
    await avatarServices.resetUserAvatar(
        request.server.s3,
        request.server.pg,
        request.log,
        request.auth!.userId
    );
    return reply.status(204).send(null);
};

export const updateUserCustomization = async (
    request: FastifyRequest<{ Body: dto.UpdateUserCustomizationRequestPayloadType }>,
    reply: FastifyReply<{ Body: dto.UpdateUserCustomizationRequestPayloadType; Reply: dto.UpdateUserCustomizationReturnType }>
) => {
    const { profileFrameUrl, profileBackgroundUrl } = request.body;

    if (profileFrameUrl === undefined && profileBackgroundUrl === undefined) throw UserErrors.error("user-invalid");
    if (profileFrameUrl && !isSafeHttpUrl(profileFrameUrl)) throw UserErrors.error("user-invalid");
    if (profileBackgroundUrl && !isSafeHttpUrl(profileBackgroundUrl)) throw UserErrors.error("user-invalid");

    const user = await services.updateUserCustomization(
        request.server.pg,
        request.auth!.userId,
        request.body
    );
    return reply.status(200).send(user);
};

export const updateUserPassword = async (
    request: FastifyRequest<{ Body: dto.UpdateUserPasswordRequestPayloadType }>,
    reply: FastifyReply<{ Body: dto.UpdateUserPasswordRequestPayloadType; Reply: dto.UpdateUserPasswordReturnType }>
) => {
    const { oldPassword, newPassword } = request.body;
    if (oldPassword === newPassword) throw UserErrors.error("user-invalid");

    await services.updateUserPassword(
        request.server.pg,
        request.auth!.userId,
        request.body
    );
    return reply.status(204).send(null);
};

export const updateUserStatus = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserStatusRequestPayloadType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Body: dto.UpdateUserStatusRequestPayloadType; Reply: dto.UpdateUserStatusReturnType }>
) => {
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
    const user = await services.updateUserRole(
        request.server.pg,
        request.params.userId,
        request.body.userRole
    );
    return reply.status(200).send(user);
};

export const createUserLink = async (
    request: FastifyRequest<{ Body: dto.CreateUserLinkRequestPayloadType }>,
    reply: FastifyReply<{ Body: dto.CreateUserLinkRequestPayloadType; Reply: dto.CreateUserLinkReturnType }>
) => {
    const { userLinkUrl } = request.body;

    if (!isSafeHttpUrl(userLinkUrl)) throw UserErrors.error("user-invalid");

    const link = await services.createUserLink(
        request.server.pg,
        request.auth!.userId,
        userLinkUrl
    );
    return reply.status(201).send(link);
};

export const listUserLinks = async (
    request: FastifyRequest<{}>,
    reply: FastifyReply<{ Reply: dto.ListUserLinksReturnType }>
) => {
    const links = await services.listUserLinksByUserId(request.server.pg, request.auth!.userId);
    return reply.status(200).send(links);
};

export const listUserLinksByUserId = async (
    request: FastifyRequest<{ Params: dto.UserIdRequestParamsType }>,
    reply: FastifyReply<{ Params: dto.UserIdRequestParamsType; Reply: dto.ListUserLinksReturnType }>
) => {
    const links = await services.listUserLinksByUserId(request.server.pg, request.params.userId);
    return reply.status(200).send(links);
};

export const updateUserLink = async (
    request: FastifyRequest<{ Params: dto.UserLinkIdRequestParamsType; Body: dto.UpdateUserLinkRequestPayloadType }>,
    reply: FastifyReply<{ Params: dto.UserLinkIdRequestParamsType; Body: dto.UpdateUserLinkRequestPayloadType; Reply: dto.UpdateUserLinkReturnType }>
) => {
    const { userLinkUrl } = request.body;

    if (!isSafeHttpUrl(userLinkUrl)) throw UserErrors.error("user-invalid");

    const link = await services.updateUserLink(
        request.server.pg,
        request.auth!.userId,
        request.params.userLinkId,
        userLinkUrl
    );
    return reply.status(200).send(link);
};

export const deleteUserLink = async (
    request: FastifyRequest<{ Params: dto.UserLinkIdRequestParamsType }>,
    reply: FastifyReply<{ Params: dto.UserLinkIdRequestParamsType; Reply: dto.DeleteUserLinkReturnType }>
) => {
    await services.deleteUserLinkById(
        request.server.pg,
        request.auth!.userId,
        request.params.userLinkId
    );
    return reply.status(204).send(null);
};