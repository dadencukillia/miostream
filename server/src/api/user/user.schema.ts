import { Type, type Static, type TSchema, type TSchemaOptions } from 'typebox';

// Enums

export const USER_ROLE = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLE)[number];

export const USER_STATUS = ['active', 'banned', 'deactivated'] as const;
export type UserStatus = (typeof USER_STATUS)[number];

// Helpers

const StringEnum = <T extends readonly string[]>(
    values: T,
    options: TSchemaOptions = {}
) =>
    Type.Unsafe<T[number]>({
        type: 'string',
        enum: [...values],
        ...options,
    });

const Nullable = <T extends TSchema>(schema: T) =>
    Type.Union([schema, Type.Null()]);

const NullableDateType = Nullable(
    Type.Unsafe<Date | string>(Type.String({ format: 'date' }))
);
const DateTimeType = Type.Unsafe<Date | string>(Type.String({ format: 'date-time' }));
const BigIntIdResponseType = Type.Unsafe<string | number>(Type.Integer({ minimum: 1 }));
const StringEnumResponseType = <T extends readonly string[]>(values: T) =>
    Type.Unsafe<string>(StringEnum(values));

// Error schemas

export const ErrorResponseSchema = Type.Object({
    ok: Type.Literal(false),
    message: Type.String(),
}, { additionalProperties: false });
export type ErrorResponseDto = Static<typeof ErrorResponseSchema>;

// Params

export const UserIdParamSchema = Type.Object({
    userId: Type.String({ format: 'uuid', description: 'User UUID' }),
}, { additionalProperties: false });
export type UserIdParamDto = Static<typeof UserIdParamSchema>;

export const UserLinkParamSchema = Type.Object({
    userId: Type.String({ format: 'uuid', description: 'User UUID' }),
    userLinkId: Type.Integer({ minimum: 1, maximum: Number.MAX_SAFE_INTEGER }),
}, { additionalProperties: false });
export type UserLinkParamDto = Static<typeof UserLinkParamSchema>;

// Response Schemas

export const UserResponseSchema = Type.Object({
    userId: Type.String({ format: 'uuid' }),
    nickname: Type.String(),
    fullName: Type.String(),
    email: Type.String({ format: 'email' }),
    bio: Type.String(),
    avatarUrl: Type.String(),
    maxStreak: Type.Integer({ minimum: 0 }),
    timezone: Type.String(),
    streakStartDate: NullableDateType,
    lastWatchDate: NullableDateType,
    profileFrameUrl: Nullable(Type.String({ format: 'uri' })),
    profileBackgroundUrl: Nullable(Type.String({ format: 'uri' })),
    userRole: StringEnumResponseType(USER_ROLE),
    userStatus: StringEnumResponseType(USER_STATUS),
    createdAt: DateTimeType,
    updatedAt: DateTimeType
}, { additionalProperties: false });
export type UserResponseDto = Static<typeof UserResponseSchema>;

export const UserLinkResponseSchema = Type.Object({
    userLinkId: BigIntIdResponseType,
    userId: Type.String({ format: 'uuid' }),
    userLinkUrl: Type.String({ format: 'uri' })
}, { additionalProperties: false });
export type UserLinkResponseDto = Static<typeof UserLinkResponseSchema>;
export type UserLinkListResponseDto = Static<typeof UserLinkResponseSchema>[];

// Request Body Schemas

export const CreateUserBodySchema = Type.Object({
    nickname: Type.String({
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$'
    }),
    fullName: Type.String({
        minLength: 2,
        maxLength: 100,
        pattern: '^[\\p{L}]([\\p{L} \'\\u2019\\u02BC.-]*[\\p{L}.])?$'
    }),
    email: Type.String({
        format: 'email',
        maxLength: 255,
    }),
    password: Type.Optional(Type.String({ minLength: 8, maxLength: 72 })),
    googleId: Type.Optional(Type.String({ maxLength: 255 })),
    timezone: Type.Optional(Type.String({ maxLength: 64 })),
}, { additionalProperties: false });
export type CreateUserDto = Static<typeof CreateUserBodySchema>;

export const UpdateUserProfileBodySchema = Type.Object({
    nickname: Type.String({
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$'
    }),
    fullName: Type.String({
        minLength: 2,
        maxLength: 100,
        pattern: '^[\\p{L}]([\\p{L} \'\\u2019\\u02BC.-]*[\\p{L}.])?$'
    }),
    bio: Type.String({ maxLength: 500, pattern: '^[^<>]*$' }),
    timezone: Type.String({ maxLength: 64 }),
}, { additionalProperties: false });
export type UpdateUserProfileDto = Static<typeof UpdateUserProfileBodySchema>;

export const UpdateUserAvatarBodySchema = Type.Object({
    avatarUrl: Type.String({ format: 'uri', maxLength: 2048 }),
}, { additionalProperties: false });
export type UpdateUserAvatarDto = Static<typeof UpdateUserAvatarBodySchema>;

export const UpdateUserCustomizationBodySchema = Type.Object({
    profileFrameUrl: Type.Optional(Nullable(Type.String({ format: 'uri', maxLength: 2048 }))),
    profileBackgroundUrl: Type.Optional(Nullable(Type.String({ format: 'uri', maxLength: 2048 }))),
}, { additionalProperties: false });
export type UpdateUserCustomizationDto = Static<typeof UpdateUserCustomizationBodySchema>;

export const UpdateUserPasswordBodySchema = Type.Object({
    oldPassword: Type.String({ minLength: 8, maxLength: 72 }),
    newPassword: Type.String({ minLength: 8, maxLength: 72 })
}, { additionalProperties: false });
export type UpdateUserPasswordDto = Static<typeof UpdateUserPasswordBodySchema>;

export const UpdateUserStatusBodySchema = Type.Object({
    userStatus: StringEnum(USER_STATUS),
}, { additionalProperties: false });
export type UpdateUserStatusDto = Static<typeof UpdateUserStatusBodySchema>;

export const UpdateUserRoleBodySchema = Type.Object({
    userRole: StringEnum(USER_ROLE)
}, { additionalProperties: false });
export type UpdateUserRoleDto = Static<typeof UpdateUserRoleBodySchema>;

export const CreateUserLinkBodySchema = Type.Object({
    userLinkUrl: Type.String({ format: 'uri', maxLength: 2048 })
}, { additionalProperties: false });
export type CreateUserLinkDto = Static<typeof CreateUserLinkBodySchema>;

export const UpdateUserLinkBodySchema = Type.Object({
    userLinkUrl: Type.String({ format: 'uri', maxLength: 2048 })
}, { additionalProperties: false });
export type UpdateUserLinkDto = Static<typeof UpdateUserLinkBodySchema>;

// Fastify Route Schemas

export const createUserRouteSchema = {
    body: CreateUserBodySchema,
    response: {
        201: UserResponseSchema,
        400: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const getUserByIdRouteSchema = {
    params: UserIdParamSchema,
    response: {
        200: UserResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const updateUserProfileRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserProfileBodySchema,
    response: {
        200: UserResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const updateUserAvatarRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserAvatarBodySchema,
    response: {
        200: UserResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const updateUserCustomizationRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserCustomizationBodySchema,
    response: {
        200: UserResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const updateUserPasswordRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserPasswordBodySchema,
    response: {
        204: Type.Null(),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const updateUserStatusRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserStatusBodySchema,
    response: {
        200: UserResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const updateUserRoleRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserRoleBodySchema,
    response: {
        200: UserResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const deleteUserRouteSchema = {
    params: UserIdParamSchema,
    response: {
        204: Type.Null(),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const createUserLinkRouteSchema = {
    params: UserIdParamSchema,
    body: CreateUserLinkBodySchema,
    response: {
        201: UserLinkResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        409: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const listUserLinksRouteSchema = {
    params: UserIdParamSchema,
    response: {
        200: Type.Array(UserLinkResponseSchema),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const updateUserLinkRouteSchema = {
    params: UserLinkParamSchema,
    body: UpdateUserLinkBodySchema,
    response: {
        200: UserLinkResponseSchema,
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;

export const deleteUserLinkRouteSchema = {
    params: UserLinkParamSchema,
    response: {
        204: Type.Null(),
        400: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
    },
} as const;