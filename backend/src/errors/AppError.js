// src/errors/AppError.js


export class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} code
   */
  constructor(
    message,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);

    this.name = this.constructor.name;

    this.statusCode = statusCode;

    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}