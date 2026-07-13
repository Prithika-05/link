// src/modules/auth/auth.schema.js

/**
 * ---------------------------------------------------------
 * Authentication Schemas
 * ---------------------------------------------------------
 */

const successSchema = {
  success: {
    type: 'boolean',
  },
  message: {
    type: 'string',
  },
};

const userSchema = {
  type: 'object',

  required: [
    'id',
    'username',
    'email',
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

    createdAt: {
      type: 'string',
      format: 'date-time',
    },
  },
};

const sessionSchema = {
  type: 'object',

  required: [
    'id',
    'userId',
    'lastSeenAt',
    'createdAt',
  ],

  properties: {
    id: {
      type: 'string',
    },

    userId: {
      type: 'string',
    },

    deviceName: {
      type: 'string',
      nullable: true,
    },

    platform: {
      type: 'string',
      nullable: true,
    },

    browser: {
      type: 'string',
      nullable: true,
    },

    ipAddress: {
      type: 'string',
      nullable: true,
    },

    userAgent: {
      type: 'string',
      nullable: true,
    },

    lastSeenAt: {
      type: 'string',
      format: 'date-time',
    },

    createdAt: {
      type: 'string',
      format: 'date-time',
    },
  },
};

const deviceInfoProperties = {
  deviceName: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },

  platform: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },

  browser: {
    type: 'string',
    minLength: 1,
    maxLength: 100,
  },
};

/* -------------------------------------------------------------------------- */
/* Register */
/* -------------------------------------------------------------------------- */

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
        ...successSchema,

        data: userSchema,
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Login */
/* -------------------------------------------------------------------------- */

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

      ...deviceInfoProperties,
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
        ...successSchema,

        data: {
          type: 'object',

          required: [
            'accessToken',
            'refreshToken',
            'user',
          ],

          properties: {
            accessToken: {
              type: 'string',
            },

            refreshToken: {
              type: 'string',
            },

            user: userSchema,
          },
        },
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Refresh */
/* -------------------------------------------------------------------------- */

export const refreshSchema = {
  summary: 'Refresh authentication tokens',

  tags: ['Authentication'],

  body: {
    type: 'object',

    additionalProperties: false,

    required: ['refreshToken'],

    properties: {
      refreshToken: {
        type: 'string',
      },

      ...deviceInfoProperties,
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
        ...successSchema,

        data: {
          type: 'object',

          required: [
            'accessToken',
            'refreshToken',
          ],

          properties: {
            accessToken: {
              type: 'string',
            },

            refreshToken: {
              type: 'string',
            },
          },
        },
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Logout */
/* -------------------------------------------------------------------------- */

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

  body: {
    type: 'object',

    additionalProperties: false,

    required: ['refreshToken'],

    properties: {
      refreshToken: {
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
        ...successSchema,

        data: {
          type: 'null',
        },
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/* Device Sessions */
/* -------------------------------------------------------------------------- */

export const sessionsSchema = {
  summary: 'Get active device sessions',

  tags: ['Authentication'],

  response: {
    200: {
      type: 'object',

      required: [
        'success',
        'message',
        'data',
      ],

      properties: {
        ...successSchema,

        data: {
          type: 'array',
          items: sessionSchema,
        },
      },
    },
  },
};

export const revokeSessionSchema = {
  summary: 'Revoke a device session',

  tags: ['Authentication'],

  params: {
    type: 'object',

    required: ['sessionId'],

    properties: {
      sessionId: {
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
        ...successSchema,

        data: {
          type: 'null',
        },
      },
    },
  },
};

export const revokeAllSessionsSchema = {
  summary: 'Revoke all device sessions',

  tags: ['Authentication'],

  response: {
    200: {
      type: 'object',

      required: [
        'success',
        'message',
        'data',
      ],

      properties: {
        ...successSchema,

        data: {
          type: 'null',
        },
      },
    },
  },
};