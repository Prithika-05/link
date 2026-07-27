export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR") {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed.") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication failed.") {
    super(message, 401, "AUTHENTICATION_FAILED");
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Access denied.") {
    super(message, 403, "ACCESS_DENIED");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message, 404, "RESOURCE_NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists.") {
    super(message, 409, "RESOURCE_CONFLICT");
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed.") {
    super(message, 500, "DATABASE_ERROR");
  }
}
