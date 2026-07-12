// src/utils/password.js

import bcrypt from 'bcrypt';

import { env } from '../config/env.js';

import { ValidationError } from '../errors/ValidationError.js';

/**
 * Hash a plain-text password.
 *
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required.');
  }

  return bcrypt.hash(password, env.bcryptRounds);
}

/**
 * Compare a plain-text password with its hash.
 *
 * @param {string} password
 * @param {string} passwordHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(
  password,
  passwordHash
) {
  if (!password || !passwordHash) {
    throw new ValidationError(
      'Password verification failed.'
    );
  }

  return bcrypt.compare(password, passwordHash);
}