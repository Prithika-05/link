// src/modules/users/users.schema.js

const userSchema = {
  type: 'object',
  required: ['id', 'username'],
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

    updatedAt: {
      type: 'string',
      format: 'date-time',
    },
  },
};

export const getCurrentUserSchema = {
  summary: 'Get authenticated user profile',

  tags: ['Users'],

  response: {
    200: {
      type: 'object',

      required: ['success', 'message', 'data'],

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

export const getUserByIdSchema = {
  summary: 'Get public user profile',

  tags: ['Users'],

  params: {
    type: 'object',

    required: ['id'],

    properties: {
      id: {
        type: 'string',
      },
    },
  },

  response: {
    200: {
      type: 'object',

      required: ['success', 'message', 'data'],

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

export const updateProfileSchema = {
  summary: 'Update authenticated user profile',

  tags: ['Users'],

  body: {
    type: 'object',

    additionalProperties: false,

    required: ['username'],

    properties: {
      username: {
        type: 'string',

        minLength: 3,

        maxLength: 30,

        pattern: '^[a-zA-Z0-9_]+$',
      },
    },
  },

  response: {
    200: {
      type: 'object',

      required: ['success', 'message', 'data'],

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

export const searchUsersSchema = {
  summary: 'Search users',

  tags: ['Users'],

  querystring: {
    type: 'object',

    required: ['q'],

    properties: {
      q: {
        type: 'string',

        minLength: 1,
      },

      page: {
        type: 'integer',

        minimum: 1,

        default: 1,
      },

      limit: {
        type: 'integer',

        minimum: 1,

        maximum: 100,

        default: 20,
      },
    },
  },

  response: {
    200: {
      type: 'object',

      required: ['success', 'message', 'data'],

      properties: {
        success: {
          type: 'boolean',
        },

        message: {
          type: 'string',
        },

        data: {
          type: 'object',

          required: ['users', 'pagination'],

          properties: {
            users: {
              type: 'array',

              items: userSchema,
            },

            pagination: {
              type: 'object',
            },
          },
        },
      },
    },
  },
};