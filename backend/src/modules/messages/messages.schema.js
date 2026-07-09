// src/modules/messages/messages.schema.js

export const sendMessageSchema = {
  body: {
    type: 'object',
    required: [
      'receiverId',
      'ciphertext',
      'iv',
      'authTag',
      'ephemeralPublicKey',
    ],

    additionalProperties: false,

    properties: {
      receiverId: {
        type: 'string',
      },

      ciphertext: {
        type: 'string',
      },

      iv: {
        type: 'string',
      },

      authTag: {
        type: 'string',
      },

      ephemeralPublicKey: {
        type: 'string',
      },
    },
  },
};

export const conversationSchema = {
  params: {
    type: 'object',
    required: ['userId'],

    properties: {
      userId: {
        type: 'string',
      },
    },
  },

  querystring: {
    type: 'object',

    properties: {
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
      },

      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 50,
      },
    },
  },
};