import type { Static } from "typebox";
import type * as userSchema from "./user.schema";
import type { TransformedType } from "@utils/modelTransformer";
import type { toPublicUserModel } from "./user.model";
import { ErrorResponse } from "@utils/errorsCollection";

// Enums
export type UserRoleType = (typeof userSchema.USER_ROLE)[number];
export type UserStatusType = (typeof userSchema.USER_STATUS)[number];

// Responses
export type ErrorResponseType = Static<typeof ErrorResponse>;
export type UserResponseType = Static<typeof userSchema.UserResponse>;
export type PublicUserResponseType = TransformedType<UserResponseType, typeof toPublicUserModel>;
export type UserLinkItemType = Static<typeof userSchema.UserLinkItem>;
export type UserLinkResponseType = Static<typeof userSchema.UserLinkResponse>;
export type UserLinkListResponseType = Static<typeof userSchema.UserLinkListResponse>;

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
export type ListUserLinksReturnType = UserLinkListResponseType | ErrorResponseType;
export type UpdateUserLinkReturnType = UserLinkResponseType | ErrorResponseType;
export type DeleteUserLinkReturnType = null | ErrorResponseType;
