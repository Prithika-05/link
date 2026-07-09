// src/config/env.js

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

const corsOrigins =
  process.env.CORS_ORIGINS.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV,

  isDevelopment:
    process.env.NODE_ENV === 'development',

  isProduction:
    process.env.NODE_ENV === 'production',

  port: Number.parseInt(
    process.env.PORT,
    10
  ),

  databaseUrl:
    process.env.DATABASE_URL,

  redisUrl:
    process.env.REDIS_URL,

  jwtSecret:
    process.env.JWT_SECRET,

  jwtAccessExpiresIn:
    process.env.JWT_ACCESS_EXPIRES_IN,

  jwtRefreshExpiresIn:
    process.env.JWT_REFRESH_EXPIRES_IN,

  bcryptRounds:
    Number.parseInt(
      process.env.BCRYPT_ROUNDS,
      10
    ),

  corsOrigins,

  logLevel:
    process.env.LOG_LEVEL ??
    (
      process.env.NODE_ENV === 'production'
        ? 'info'
        : 'debug'
    ),
};