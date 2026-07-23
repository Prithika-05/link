// src/utils/password.js

import bcrypt from 'bcrypt';

import { env } from '../config/env.js';

import { ValidationError } from '../errors/ValidationError.js';

export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required.');
  }

  const value = password.trim();

  if (value.length < 8) {
    throw new ValidationError(
      'Password must be at least 8 characters long.'
    );
  }

  const strongPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

  if (!strongPassword.test(value)) {
    throw new ValidationError(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
    );
  }
}


export async function hashPassword(password) {
  validatePassword(password);

  return bcrypt.hash(
    password.trim(),
    env.bcryptRounds
  );
}

export async function verifyPassword(
  password,
  passwordHash
) {
  if (!password || !passwordHash) {
    throw new ValidationError(
      'Password verification failed.'
    );
  }

  return bcrypt.compare(
    password.trim(),
    passwordHash
  );
}