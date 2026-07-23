// src/utils/response.js

export function successResponse(
  reply,
  data = null,
  message = 'Success',
  statusCode = 200
) {
  return reply.status(statusCode).send({
    success: true,
    message,
    data,
  });
}

export function errorResponse(reply, error) {
  const statusCode = error.statusCode || 500;

  return reply.status(statusCode).send({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message:
        statusCode >= 500
          ? 'Internal Server Error'
          : error.message,
    },
  });
}