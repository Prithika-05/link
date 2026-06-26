// src/app.js

import Fastify from 'fastify';
import { loggerConfig } from './plugins/logger.js';

const app = Fastify({
  logger: loggerConfig,
});

// Health Check
app.get('/health', async () => {
  return {
    success: true,
    message: 'Secure Chat API is running.',
    timestamp: new Date().toISOString(),
  };
});

// Global Error Handler
app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  reply.status(error.statusCode || 500).send({
    success: false,
    message: error.message || 'Internal Server Error',
  });
});

export default app;