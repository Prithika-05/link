// src/modules/messages/messages.schema.js

const messageSchema = {
  type: 'object',

  required: [
    'id',
    'senderId',
    'receiverId',
    'ciphertext',
    'iv',
    'authTag',
    'ephemeralPublicKey',
    'status',
    'createdAt',
  ],

  properties: {
    id: {
      type: 'string',
    },

    senderId: {
      type: 'string',
    },

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

    type: {
      type: 'string',
    },

    status: {
      type: 'string',
      enum: ['SENT', 'DELIVERED', 'READ'],
    },

    createdAt: {
      type: 'string',
      format: 'date-time',
    },
  },
};

export const sendMessageSchema = {
  summary: 'Send an encrypted message',

  tags: ['Messages'],

  body: {
    type: 'object',

    additionalProperties: false,

    required: [
      'receiverId',
      'ciphertext',
      'iv',
      'authTag',
      'ephemeralPublicKey',
    ],

    properties: {
      receiverId: {
        type: 'string',
      },

      ciphertext: {
        type: 'string',

        minLength: 1,

        maxLength: 50000,
      },

      iv: {
        type: 'string',

        minLength: 1,

        maxLength: 256,
      },

      authTag: {
        type: 'string',

        minLength: 1,

        maxLength: 256,
      },

      ephemeralPublicKey: {
        type: 'string',

        minLength: 1,

        maxLength: 4096,
      },
    },
  },

  response: {
    201: {
      type: 'object',

      required: ['success', 'message', 'data'],

      properties: {
        success: {
          type: 'boolean',
        },

        message: {
          type: 'string',
        },

        data: messageSchema,
      },
    },
  },
};

export const conversationSchema = {
  summary: 'Retrieve conversation history',

  tags: ['Messages'],

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

          required: ['messages', 'pagination'],

          properties: {
            messages: {
              type: 'array',

              items: messageSchema,
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

export const markDeliveredSchema = {
  summary: 'Mark a message as delivered',

  tags: ['Messages'],

  params: {
    type: 'object',

    required: ['messageId'],

    properties: {
      messageId: {
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

        data: messageSchema,
      },
    },
  },
};

export const markReadSchema = {
  summary: 'Mark a message as read',

  tags: ['Messages'],

  params: {
    type: 'object',

    required: ['messageId'],

    properties: {
      messageId: {
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

        data: messageSchema,
      },
    },
  },
};