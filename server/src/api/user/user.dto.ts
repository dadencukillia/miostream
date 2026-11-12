import type { Static } from "typebox";
import * as userSchema from "./user.schema";

// Enums
export type UserRoleType = (typeof userSchema.USER_ROLE)[number];
export type UserStatusType = (typeof userSchema.USER_STATUS)[number];

// Responses
export type ErrorResponseType = Static<typeof userSchema.ErrorResponse>;
export type UserResponseType = Static<typeof userSchema.UserResponse>;
export type PublicUserResponseType = Static<typeof userSchema.PublicUserResponse>;
export type UserLinkResponseType = Static<typeof userSchema.UserLinkResponse>;
export type UserLinkListResponseType = UserLinkResponseType[];

// Request Params
export type UserIdentifierRequestParamsType = Static<typeof userSchema.UserIdentifierRequestParams>;
export type UserIdRequestParamsType = Static<typeof userSchema.UserIdRequestParams>;
export type UserLinkIdRequestParamsType = Static<typeof userSchema.UserLinkIdRequestParams>;

// Request Payloads
export type CreateUserRequestPayloadType = Static<typeof userSchema.CreateUserRequestPayload>;
export type UpdateUserProfileRequestPayloadType = Static<typeof userSchema.UpdateUserProfileRequestPayload>;
export type UpdateUserCustomizationRequestPayloadType = Static<typeof userSchema.UpdateUserCustomizationRequestPayload>;
export type UpdateUserPasswordRequestPayloadType = Static<typeof userSchema.UpdateUserPasswordRequestPayload>;
export type UpdateUserStatusRequestPayloadType = Static<typeof userSchema.UpdateUserStatusRequestPayload>;
export type UpdateUserRoleRequestPayloadType = Static<typeof userSchema.UpdateUserRoleRequestPayload>;
export type UpdateUserAvatarRequestPayloadType = Static<typeof userSchema.UpdateUserAvatarRequestPayload>;
export type CreateUserLinkRequestPayloadType = Static<typeof userSchema.CreateUserLinkRequestPayload>;
export type UpdateUserLinkRequestPayloadType = Static<typeof userSchema.UpdateUserLinkRequestPayload>;

// Controller Return Types
export type CreateUserReturnType = UserResponseType | ErrorResponseType;
export type GetUserReturnType = PublicUserResponseType | ErrorResponseType;
export type GetUserByIdReturnType = PublicUserResponseType | ErrorResponseType;
export type UpdateUserProfileReturnType = UserResponseType | ErrorResponseType;
export type UpdateUserAvatarReturnType = UserResponseType | ErrorResponseType;
export type DeleteUserAvatarReturnType = null | ErrorResponseType;
export type UpdateUserCustomizationReturnType = UserResponseType | ErrorResponseType;
export type UpdateUserPasswordReturnType = null | ErrorResponseType;
export type UpdateUserStatusReturnType = UserResponseType | ErrorResponseType;
export type UpdateUserRoleReturnType = UserResponseType | ErrorResponseType;
export type DeleteUserReturnType = null | ErrorResponseType;
export type DeleteUserByIdReturnType = null | ErrorResponseType;
export type CreateUserLinkReturnType = UserLinkResponseType | ErrorResponseType;
export type ListUserLinksReturnType = UserLinkResponseType[] | ErrorResponseType;
export type UpdateUserLinkReturnType = UserLinkResponseType | ErrorResponseType;
export type DeleteUserLinkReturnType = null | ErrorResponseType;
