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
        profile_frame:      { type: 'string', format: 'uri' },
        profile_background: { type: 'string', format: 'uri' }
    }
}

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
}

export interface UserParams {
    id: string;
}

export interface CreateUserInput {
    email: string;
    password_hash: string;
    nickname?: string;
    name?: string;
    bio?: string;
    avatar_url?: string;
    social_networks?: string[];
}

export interface UpdateUserInput extends Partial<CreateUserInput> {}

export const createUserSchema = {
    body: { 
        type: 'object',
        required: [
            'nickname', 
            'name',
            'email',
            'password_hash',
        ],
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
            password_hash: { type: 'string' },
            bio:                { type: 'string' },
            avatar_url:         { type: 'string' },
            social_networks:    { type: 'array', items: { type: 'string', format: 'uri' } },
            profile_frame:      { type: 'string', format: 'uri' },
            profile_background: { type: 'string', format: 'uri' }
        },
        additionalProperties: false
    },
    response: {
        201: userSchema
    }
}

export const getUserSchema = {
    params: userParamsSchema,
    response: {
        200: userSchema,
        404: {
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        }
    }
}

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
            password_hash:      { type: 'string' },
            bio:                { type: 'string' },
            avatar_url:         { type: 'string' },
            social_networks:    { type: 'array', items: { type: 'string', format: 'uri' } },
            profile_frame:      { type: 'string', format: 'uri' },
            profile_background: { type: 'string', format: 'uri' }
        },
        additionalProperties: false
    },
    response: {
        200: userSchema,
        404: {
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        }
    }
};

export const deleteUserSchema = {
    params: userParamsSchema,
    response: {
        204: {
            type: 'null'
        },
        404: {
            type: 'object',
            properties: {
                error: { type: 'string' }
            }
        }
    }
}