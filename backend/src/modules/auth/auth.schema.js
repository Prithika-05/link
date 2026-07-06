// src/modules/auth/auth.schema.js

export const registerSchema = {
  body: {
    type: 'object',
    required: ['username', 'email', 'password'],
    additionalProperties: false,

    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
      },

      email: {
        type: 'string',
        format: 'email',
      },

      password: {
        type: 'string',
        minLength: 8,
        maxLength: 128,
      },
    },
  },

  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  },
};

export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,

    properties: {
      email: {
        type: 'string',
        format: 'email',
      },

      password: {
        type: 'string',
      },
    },
  },

  response: {
    200: {
      type: 'object',
      required: ['success', 'token', 'user'],
      properties: {
        success: { type: 'boolean' },
        token: { type: 'string' },
        user: {
          type: 'object',
          required: ['id', 'username', 'email'],
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
      },
    },
  },
};