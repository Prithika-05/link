// src/plugins/logger.js

const isProduction = process.env.NODE_ENV === 'production';

export const loggerConfig = {
  level: isProduction ? 'info' : 'debug',

  serializers: {
    req(request) {
      return {
        id: request.id,
        method: request.method,
        url: request.url,
        ip: request.ip,
      };
    },

    res(reply) {
      return {
        statusCode: reply.statusCode,
      };
    },

    err(error) {
      return {
        type: error.name,
        message: error.message,
        stack: error.stack,
      };
    },
  },

  redact: {
    paths: [
      'req.headers.authorization',
      'headers.authorization',
    ],
    censor: '[REDACTED]',
  },

  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
};