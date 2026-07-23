// src/errors/DatabaseError.js

import { AppError } from './AppError.js';

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed.') {
    super(
      message,
      500,
      'DATABASE_ERROR'
    );
  }
}