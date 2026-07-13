// src/modules/keys/keys.schema.js

const publicKeySchema = {
  type: 'object',

  required: [
    'id',
    'algorithm',
    'key',
    'fingerprint',
    'createdAt',
    'updatedAt',
  ],

  properties: {
    id: {
      type: 'string',
    },

    algorithm: {
      type: 'string',
      enum: ['ECDH-P256'],
    },

    key: {
      type: 'string',
    },

    fingerprint: {
      type: 'string',
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

const publicKeySummarySchema = {
  type: 'object',

  required: [
    'id',
    'algorithm',
    'fingerprint',
    'createdAt',
    'updatedAt',
  ],

  properties: {
    id: {
      type: 'string',
    },

    algorithm: {
      type: 'string',
      enum: ['ECDH-P256'],
    },

    fingerprint: {
      type: 'string',
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
/*                               Upload Key                                   */
/* -------------------------------------------------------------------------- */

export const uploadKeySchema = {
  summary: 'Upload or update a public key',

  tags: ['Keys'],

  body: {
    type: 'object',

    additionalProperties: false,

    required: [
      'algorithm',
      'key',
    ],

    properties: {
      algorithm: {
        type: 'string',

        enum: ['ECDH-P256'],
      },

      key: {
        type: 'string',

        minLength: 64,

        maxLength: 4096,
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

        data: publicKeySchema,
      },
    },

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

        data: publicKeySchema,
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                                Get Key                                     */
/* -------------------------------------------------------------------------- */

export const getKeySchema = {
  summary: 'Retrieve a user public key',

  tags: ['Keys'],

  params: {
    type: 'object',

    required: ['userId'],

    properties: {
      userId: {
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

        data: publicKeySchema,
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                               List Keys                                    */
/* -------------------------------------------------------------------------- */

export const listKeysSchema = {
  summary: "List authenticated user's public keys",

  tags: ['Keys'],

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

          items: publicKeySummarySchema,
        },
      },
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                               Delete Key                                   */
/* -------------------------------------------------------------------------- */

export const deleteKeySchema = {
  summary: 'Delete authenticated user public key',

  tags: ['Keys'],

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