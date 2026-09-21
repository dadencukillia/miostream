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
        max_streak:         { type: 'integer' },
        timezone:           { type: 'string' },
        last_action:        { type: 'string', format: 'date' },
        profile_frame:      { type: 'string', format: 'uri' },
        profile_background: { type: 'string', format: 'uri' },
        created_at:         { type: 'integer', format: 'date-time' },
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
            nickname: { 
                type: 'string',
                minLength: 3,
                maxLength: 30,
                pattern: '^[a-zA-Z0-9_]+$'
            },
            name: { 
                type: 'string',
                minLength: 3,
                maxLength: 100,
                pattern: '^[\\p{L}]([\\p{L} \'\\u2019\\u02BC.-]*[\\p{L}.])?$'
            },
            email: { 
                type: 'string', 
                format: 'email'
            },
            password: { 
                type: 'string', 
                minLength: 8
            }
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
                maxLength: 30,
                pattern: '^[a-zA-Z0-9_]+$'
            },
            name: {
                type: 'string',
                minLength: 3,
                maxLength: 100,
                pattern: '^[\\p{L}]([\\p{L} \'\\u2019\\u02BC.-]*[\\p{L}.])?$'
            },
            email: { 
                type: 'string',
                format: 'email'
            },
            bio: { 
                type: 'string',
                pattern: '^[^<>]*$' 
            },
            avatar_url: { 
                type: 'string',
                pattern: '^[^<>]*$'
            },
            social_networks: { 
                type: 'array', 
                items: { 
                    type: 'string', 
                    format: 'uri'
                } 
            },
            timezone:           { type: 'string' },
            last_action:        { type: 'string', format: 'date' },
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