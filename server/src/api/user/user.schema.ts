import { ProfileFrame, ProfileBackground } from "@prisma/generated/client";

const userSchema = {
    type: 'object',
    properties: {
        id:         { type: 'string', format: 'uuid' },
        nickname:   { type: 'string' },
        name:       { type: 'string' },
        email:      { type: 'string', format: 'email' },
        bio:        { type: 'string' },
        avatar_url: { type: 'string' },
        social_networks:    { type: 'array', items: { type: 'string', format: 'uri' } },
        current_streak:     { type: 'integer' },
        max_streak:         { type: 'integer' },
        profile_frame:      { type: 'string', enum: Object.values(ProfileFrame) },
        profile_background: { type: 'string', enum: Object.values(ProfileBackground) }
    }
};

const errorSchema = {
    type: 'object',
    properties: {
        ok: { type: 'boolean' },
        message: { type: 'string' }
    }
};

const userParamsSchema = {
    type: 'object',
    required: ['id'],
    properties: {
        id: { 
            type: 'string', 
            format: 'uuid'
        }
    },
    additionalProperties: false
};

export const createUserSchema = {
    body: { 
        type: 'object',
        required: [
            'nickname', 
            'name',
            'email',
            'password',
        ],
        properties: {
            nickname: { type: 'string', minLength: 3, maxLength: 30 },
            name: { type: 'string', minLength: 3, maxLength: 100 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            bio: { type: 'string' },
            avatar_url: { type: 'string' },
            social_networks: { type: 'array', items: { type: 'string', format: 'uri' } },
            profile_frame: { type: 'string', enum: Object.values(ProfileFrame) },
            profile_background: { type: 'string', enum: Object.values(ProfileBackground) }
        },
        additionalProperties: false
    },
    response: {
        '201': userSchema,
        '4xx': errorSchema
    }
};

export const getUserSchema = {
    params: userParamsSchema,
    response: {
        '200': userSchema,
        '4xx': errorSchema
    }
};

export const updateUserSchema = {
    params: userParamsSchema,
    body: { 
        type: 'object',
        properties: {
            nickname: { 
                type: 'string',
                minLength: 3,
                maxLength: 30
            },
            name: {
                type: 'string',
                minLength: 3,
                maxLength: 100
            },
            email: { 
                type: 'string',
                format: 'email' 
            },
            bio:                { type: 'string' },
            avatar_url:         { type: 'string' },
            social_networks:    { type: 'array', items: { type: 'string', format: 'uri' } },
            profile_frame:      { type: 'string', enum: Object.values(ProfileFrame) },
            profile_background: { type: 'string', enum: Object.values(ProfileBackground) }
        },
        additionalProperties: false
    },
    response: {
        '200': userSchema,
        '4xx': errorSchema
    }
};

export const deleteUserSchema = {
    params: userParamsSchema,
    response: {
        '204': { type: 'null' },
        '4xx': errorSchema
    }
};