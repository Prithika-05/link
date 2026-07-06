// src/config/env.js

import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL',
  'NODE_ENV',
];

for (const variable of requiredEnvVars) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

export const env = {
  port: Number(process.env.PORT),

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET,

  redisUrl: process.env.REDIS_URL,

  nodeEnv: process.env.NODE_ENV,

  isDevelopment: process.env.NODE_ENV === 'development',

  isProduction: process.env.NODE_ENV === 'production',
};