// src/utils/response.js

/**
 * Send a successful response.
 *
 * @param {import('fastify').FastifyReply} reply
 * @param {*} data
 * @param {string} message
 * @param {number} statusCode
 */
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

/**
 * Send an error response.
 *
 * @param {import('fastify').FastifyReply} reply
 * @param {Error} error
 */
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