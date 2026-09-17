// Schema for user objects returned in responses
const userSchema = {
    type: 'object',
    properties: {
        id:         { type: 'string', format: 'uuid' },
        nickname:   { type: 'string' },
        name:       { type: 'string' },
        email:      { type: 'string', format: 'email' },
        bio:        { type: 'string' },
        avatar_url: { type: 'string', format: 'uri'  },
        social_networks:    { type: 'array', items: { type: 'string', format: 'uri' } },
        current_streak:     { type: 'integer' },
        max_streak:         { type: 'integer' },
        profile_frame:      { type: 'string', format: 'uri' },
        profile_background: { type: 'string', format: 'uri' }
    }
}

// Schema for creating a new user
const createUserSchema = {
    body: { 
        type: 'object',
        required: [
            'nickname', 
            'name',
            'email',
            'password',
        ],
        properties: {
            nickname:   { 
                type: 'string',
                minLength: 3,
                maxLength: 30
            },
            name:       {
                type: 'string',
                minLength: 3,
                maxLength: 100
            },
            email:      { 
                type: 'string',
                format: 'email' 
            },
            password:   {
                type: 'string' 
            }
        },
        additionalProperties: false
    },
    response: {
        201: userSchema
    }
}