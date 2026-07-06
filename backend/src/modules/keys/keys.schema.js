// src/modules/keys/keys.schema.js

export const uploadKeySchema = {
  body: {
    type: 'object',
    required: ['algorithm', 'key', 'fingerprint'],
    additionalProperties: false,

    properties: {
      algorithm: {
        type: 'string',
        enum: ['ECDH-P256'],
      },

      key: {
        type: 'string',
        minLength: 1,
      },

      fingerprint: {
        type: 'string',
        minLength: 32,
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

export const getKeySchema = {
  params: {
    type: 'object',
    required: ['userId'],

    properties: {
      userId: {
        type: 'string',
      },
    },
  },
};