import { Type, Static } from '@sinclair/typebox';

export const UserRoleSchema = Type.Union([
    Type.Literal('user'),
    Type.Literal('admin')
]);
export type UserRole = Static<typeof UserRoleSchema>;

export const UserStatusSchema = Type.Union([
    Type.Literal('active'),
    Type.Literal('banned'),
    Type.Literal('deactivated')
]);
export type UserStatus = Static<typeof UserStatusSchema>;

export const ErrorResponseSchema = Type.Object({
    ok: Type.Boolean({ default: false }),
    message: Type.String()
}, { additionalProperties: false });
export type ErrorResponseDto = Static<typeof ErrorResponseSchema>;

// Params

export const UserIdParamSchema = Type.Object({
    user_id: Type.String({ format: 'uuid' })
}, { additionalProperties: false });
export type UserIdParamDto = Static<typeof UserIdParamSchema>;

export const UserLinkParamSchema = Type.Object({
    user_id: Type.String({ format: 'uuid' }),
    user_link_id: Type.Integer({ minimum: 1 })
}, { additionalProperties: false });
export type UserLinkParamDto = Static<typeof UserLinkParamSchema>;

// Response

export const UserResponseSchema = Type.Object({
    user_id: Type.String({ format: 'uuid' }),
    nickname: Type.String(),
    full_name: Type.String(),
    email: Type.String({ format: 'email' }),
    bio: Type.String(),
    avatar_url: Type.String(),
    max_streak: Type.Integer({ minimum: 0 }),
    timezone: Type.String(),
    streak_start_date: Type.Union([Type.String({ format: 'date' }), Type.Null()]),
    last_watch_date: Type.Union([Type.String({ format: 'date' }), Type.Null()]),
    profile_frame_url: Type.Union([Type.String({ format: 'uri' }), Type.Null()]),
    profile_background_url: Type.Union([Type.String({ format: 'uri' }), Type.Null()]),
    user_role: UserRoleSchema,
    user_status: UserStatusSchema,
    created_at: Type.String({ format: 'date-time' }),
    updated_at: Type.String({ format: 'date-time' })
}, { additionalProperties: false });
export type UserResponseDto = Static<typeof UserResponseSchema>;

export const UserLinkResponseSchema = Type.Object({
    user_link_id: Type.Integer({ minimum: 1 }),
    user_id: Type.String({ format: 'uuid' }),
    user_link_url: Type.String({ format: 'uri' })
}, { additionalProperties: false });
export type UserLinkResponseDto = Static<typeof UserLinkResponseSchema>;

// Request

export const CreateUserBodySchema = Type.Object({
    nickname: Type.String({
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$'
    }),
    full_name: Type.String({
        minLength: 2,
        maxLength: 100,
        pattern: '^[\\p{L}]([\\p{L} \'\\u2019\\u02BC.-]*[\\p{L}.])?$'
    }),
    email: Type.String({
        format: 'email',
        maxLength: 255
    }),
    password: Type.Optional(Type.String({
        minLength: 8,
        maxLength: 72
    })),
    google_id: Type.Optional(Type.String({
        maxLength: 255
    })),
    timezone: Type.Optional(Type.String({
        maxLength: 64
    }))
}, { additionalProperties: false });
export type CreateUserDto = Static<typeof CreateUserBodySchema>;

export const UpdateUserProfileBodySchema = Type.Object({
    nickname: Type.String({
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$'
    }),
    full_name: Type.String({
        minLength: 2,
        maxLength: 100,
        pattern: '^[\\p{L}]([\\p{L} \'\\u2019\\u02BC.-]*[\\p{L}.])?$'
    }),
    bio: Type.String({
        maxLength: 500,
        pattern: '^[^<>]*$'
    }),
    timezone: Type.String({
        maxLength: 64
    })
}, { additionalProperties: false });
export type UpdateUserProfileDto = Static<typeof UpdateUserProfileBodySchema>;

export const UpdateUserAvatarBodySchema = Type.Object({
    avatar_url: Type.String({
        format: 'uri',
        maxLength: 2048
    })
}, { additionalProperties: false });
export type UpdateUserAvatarDto = Static<typeof UpdateUserAvatarBodySchema>;

export const UpdateUserCustomizationBodySchema = Type.Object({
    profile_frame_url: Type.Optional(
        Type.Union([Type.String({ format: 'uri', maxLength: 2048 }), Type.Null()])
    ),
    profile_background_url: Type.Optional(
        Type.Union([Type.String({ format: 'uri', maxLength: 2048 }), Type.Null()])
    )
}, { additionalProperties: false });
export type UpdateUserCustomizationDto = Static<typeof UpdateUserCustomizationBodySchema>;

export const UpdateUserPasswordBodySchema = Type.Object({
    old_password: Type.String({ minLength: 8, maxLength: 72 }),
    new_password: Type.String({ minLength: 8, maxLength: 72 })
}, { additionalProperties: false });
export type UpdateUserPasswordDto = Static<typeof UpdateUserPasswordBodySchema>;

export const UpdateUserStatusBodySchema = Type.Object({
    user_status: UserStatusSchema
}, { additionalProperties: false });
export type UpdateUserStatusDto = Static<typeof UpdateUserStatusBodySchema>;

export const UpdateUserRoleBodySchema = Type.Object({
    user_role: UserRoleSchema
}, { additionalProperties: false });
export type UpdateUserRoleDto = Static<typeof UpdateUserRoleBodySchema>;

export const CreateUserLinkBodySchema = Type.Object({
    user_link_url: Type.String({ format: 'uri', maxLength: 2048 })
}, { additionalProperties: false });
export type CreateUserLinkDto = Static<typeof CreateUserLinkBodySchema>;

export const UpdateUserLinkBodySchema = Type.Object({
    user_link_url: Type.String({ format: 'uri', maxLength: 2048 })
}, { additionalProperties: false });
export type UpdateUserLinkDto = Static<typeof UpdateUserLinkBodySchema>;

// Fastify schemas

export const createUserRouteSchema = {
    body: CreateUserBodySchema,
    response: {
        201: UserResponseSchema,
        '4xx': ErrorResponseSchema
    }
};

export const getUserByIdRouteSchema = {
    params: UserIdParamSchema,
    response: {
        200: UserResponseSchema,
        '4xx': ErrorResponseSchema
    }
};

export const updateUserProfileRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserProfileBodySchema,
    response: {
        200: UserResponseSchema,
        '4xx': ErrorResponseSchema
    }
};

export const updateUserAvatarRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserAvatarBodySchema,
    response: {
        200: UserResponseSchema,
        '4xx': ErrorResponseSchema
    }
};

export const updateUserCustomizationRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserCustomizationBodySchema,
    response: {
        200: UserResponseSchema,
        '4xx': ErrorResponseSchema
    }
};

export const updateUserPasswordRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserPasswordBodySchema,
    response: {
        204: Type.Null(),
        '4xx': ErrorResponseSchema
    }
};

export const updateUserStatusRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserStatusBodySchema,
    response: {
        200: UserResponseSchema,
        '4xx': ErrorResponseSchema
    }
};

export const updateUserRoleRouteSchema = {
    params: UserIdParamSchema,
    body: UpdateUserRoleBodySchema,
    response: {
        200: UserResponseSchema,
        '4xx': ErrorResponseSchema
    }
};

export const deleteUserRouteSchema = {
    params: UserIdParamSchema,
    response: {
        204: Type.Null(),
        '4xx': ErrorResponseSchema
    }
};

export const createUserLinkRouteSchema = {
    params: UserIdParamSchema,
    body: CreateUserLinkBodySchema,
    response: {
        201: UserLinkResponseSchema,
        '4xx': ErrorResponseSchema
    }
};

export const listUserLinksRouteSchema = {
    params: UserIdParamSchema,
    response: {
        200: Type.Array(UserLinkResponseSchema),
        '4xx': ErrorResponseSchema
    }
};

export const updateUserLinkRouteSchema = {
    params: UserLinkParamSchema,
    body: UpdateUserLinkBodySchema,
    response: {
        200: UserLinkResponseSchema,
        '4xx': ErrorResponseSchema
    }
};

export const deleteUserLinkRouteSchema = {
    params: UserLinkParamSchema,
    response: {
        204: Type.Null(),
        '4xx': ErrorResponseSchema
    }
};