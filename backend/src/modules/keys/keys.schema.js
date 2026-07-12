// src/modules/keys/keys.schema.js

const publicKeySchema = {
  type: 'object',
  required: [
    'algorithm',
    'key',
    'fingerprint',
    'createdAt',
  ],
  properties: {
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

export const uploadKeySchema = {
  summary: 'Upload or update a public key',

  tags: ['Keys'],

  body: {
    type: 'object',

    additionalProperties: false,

    required: ['algorithm', 'key'],

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