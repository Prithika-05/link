// src/config/env.js

/**
 * ---------------------------------------------------------
 * Environment Configuration
 * ---------------------------------------------------------
 * Loads and validates all required environment variables.
 * ---------------------------------------------------------
 */

import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',

  'DATABASE_URL',

  'REDIS_URL',

  'JWT_SECRET',

  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',

  'BCRYPT_ROUNDS',

  'CORS_ORIGINS',
];

for (const variable of requiredEnvVars) {
  if (!process.env[variable]) {
    throw new Error(
      `Missing required environment variable: ${variable}`
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                               NODE ENV                                     */
/* -------------------------------------------------------------------------- */

const allowedNodeEnvs = [
  'development',
  'test',
  'production',
];

if (!allowedNodeEnvs.includes(process.env.NODE_ENV)) {
  throw new Error(
    `Invalid NODE_ENV: ${process.env.NODE_ENV}`
  );
}

/* -------------------------------------------------------------------------- */
/*                              PORT VALIDATION                               */
/* -------------------------------------------------------------------------- */

const port = Number.parseInt(process.env.PORT, 10);

if (Number.isNaN(port) || port <= 0 || port > 65535) {
  throw new Error('Invalid PORT.');
}

/* -------------------------------------------------------------------------- */
/*                          BCRYPT VALIDATION                                 */
/* -------------------------------------------------------------------------- */

const bcryptRounds = Number.parseInt(
  process.env.BCRYPT_ROUNDS,
  10
);

if (
  Number.isNaN(bcryptRounds) ||
  bcryptRounds < 10 ||
  bcryptRounds > 15
) {
  throw new Error(
    'BCRYPT_ROUNDS must be between 10 and 15.'
  );
}

/* -------------------------------------------------------------------------- */
/*                          JWT SECRET VALIDATION                             */
/* -------------------------------------------------------------------------- */

if (process.env.JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET must contain at least 32 characters.'
  );
}

/* -------------------------------------------------------------------------- */
/*                               CORS ORIGINS                                */
/* -------------------------------------------------------------------------- */

const corsOrigins = process.env.CORS_ORIGINS
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

/* -------------------------------------------------------------------------- */
/*                                ENV EXPORT                                  */
/* -------------------------------------------------------------------------- */

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV,

  isDevelopment:
    process.env.NODE_ENV === 'development',

  isProduction:
    process.env.NODE_ENV === 'production',

  host: process.env.HOST ?? '0.0.0.0',

  port,

  databaseUrl: process.env.DATABASE_URL.trim(),

  redisUrl: process.env.REDIS_URL.trim(),

  jwtSecret: process.env.JWT_SECRET.trim(),

  jwtAccessExpiresIn:
    process.env.JWT_ACCESS_EXPIRES_IN.trim(),

  jwtRefreshExpiresIn:
    process.env.JWT_REFRESH_EXPIRES_IN.trim(),

  bcryptRounds,

  corsOrigins,

  logLevel:
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === 'production'
      ? 'info'
      : 'debug'),
});