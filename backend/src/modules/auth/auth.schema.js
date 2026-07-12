// src/modules/auth/auth.schema.js

const userSchema = {
  type: 'object',
  required: ['id', 'username', 'email'],
  properties: {
    id: {
      type: 'string',
    },

    username: {
      type: 'string',
    },

    email: {
      type: 'string',
      format: 'email',
    },

    createdAt: {
      type: 'string',
      format: 'date-time',
    },
  },
};

export const registerSchema = {
  summary: 'Register a new user',

  tags: ['Authentication'],

  body: {
    type: 'object',

    additionalProperties: false,

    required: [
      'username',
      'email',
      'password',
    ],

    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$',
        description:
          'Username may contain letters, numbers and underscores.',
      },

      email: {
        type: 'string',
        format: 'email',
      },

      password: {
        type: 'string',

        minLength: 8,

        maxLength: 128,

        pattern:
          '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',

        description:
          'Minimum 8 characters, including uppercase, lowercase and a number.',
      },
    },
  },

  response: {
    201: {
      type: 'object',

      required: [
        'success',
        'message',
        'data',
      ],

      properties: {
        success: {
          type: 'boolean',
        },

        message: {
          type: 'string',
        },

        data: userSchema,
      },
    },
  },
};

export const loginSchema = {
  summary: 'Authenticate a user',

  tags: ['Authentication'],

  body: {
    type: 'object',

    additionalProperties: false,

    required: [
      'email',
      'password',
    ],

    properties: {
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
    200: {
      type: 'object',

      required: [
        'success',
        'message',
        'data',
      ],

      properties: {
        success: {
          type: 'boolean',
        },

        message: {
          type: 'string',
        },

        data: {
          type: 'object',

          required: [
            'accessToken',
            'user',
          ],

          properties: {
            accessToken: {
              type: 'string',
            },

            user: userSchema,
          },
        },
      },
    },
  },
};

export const logoutSchema = {
  summary: 'Logout the authenticated user',

  tags: ['Authentication'],

  headers: {
    type: 'object',

    required: ['authorization'],

    properties: {
      authorization: {
        type: 'string',
      },
    },
  },

  response: {
    200: {
      type: 'object',

      required: [
        'success',
        'message',
        'data',
      ],

      properties: {
        success: {
          type: 'boolean',
        },

        message: {
          type: 'string',
        },

        data: {
          type: 'null',
        },
      },
    },
  },
};