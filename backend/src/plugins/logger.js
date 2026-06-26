// src/plugins/logger.js

export const loggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            colorize: true,
            singleLine: true,
          },
        },
};