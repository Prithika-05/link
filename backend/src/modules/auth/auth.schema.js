// src/modules/auth/auth.schema.js

/**
 * ---------------------------------------------------------
 * Authentication Schemas
 * ---------------------------------------------------------
 * JSON Schemas for authentication endpoints.
 * ---------------------------------------------------------
 */

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
      type: ['string', 'null'],
    },

    platform: {
      type: ['string', 'null'],
    },

    browser: {
      type: ['string', 'null'],
    },

    ipAddress: {
      type: ['string', 'null'],
    },

    userAgent: {
      type: ['string', 'null'],
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

/* -------------------------------------------------------------------------- */
/*                                Register                                    */
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
/*                                  Login                                     */
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

      deviceName: {
        type: 'string',
      },

      platform: {
        type: 'string',
      },

      browser: {
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
/*                                 Refresh                                    */
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

      deviceName: {
        type: 'string',
      },

      platform: {
        type: 'string',
      },

      browser: {
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
/*                                  Logout                                    */
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
/*                            Device Sessions                                 */
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
        success: {
          type: 'boolean',
        },

        message: {
          type: 'string',
        },

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