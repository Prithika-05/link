// src/modules/users/users.schema.js

const userSchema = {
  type: 'object',

  required: [
    'id',
    'username',
    'status',
  ],

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

    status: {
      type: 'string',
      enum: [
        'ONLINE',
        'OFFLINE',
        'AWAY',
      ],
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

/* -------------------------------------------------------------------------- */
/*                                Current User                                */
/* -------------------------------------------------------------------------- */

export const getCurrentUserSchema = {
  summary: 'Get authenticated user profile',

  tags: ['Users'],

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

        data: userSchema,
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                               Get User By ID                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                           Get User By Username                             */
/* -------------------------------------------------------------------------- */

export const getUserByUsernameSchema = {
  summary: 'Get user by username',

  tags: ['Users'],

  params: {
    type: 'object',

    required: ['username'],

    properties: {
      username: {
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

        data: userSchema,
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                              Update Profile                                */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                             Change Password                                */
/* -------------------------------------------------------------------------- */

export const changePasswordSchema = {
  summary: 'Change account password',

  tags: ['Users'],

  body: {
    type: 'object',

    additionalProperties: false,

    required: [
      'currentPassword',
      'newPassword',
    ],

    properties: {
      currentPassword: {
        type: 'string',

        minLength: 8,

        maxLength: 128,
      },

      newPassword: {
        type: 'string',

        minLength: 8,

        maxLength: 128,

        pattern:
          '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
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

/* -------------------------------------------------------------------------- */
/*                               Search Users                                 */
/* -------------------------------------------------------------------------- */

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
            'users',
            'pagination',
          ],

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