// src/errors/AuthorizationError.js

import { AppError } from './AppError.js';

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied.') {
    super(
      message,
      403,
      'ACCESS_DENIED'
    );
  }
}