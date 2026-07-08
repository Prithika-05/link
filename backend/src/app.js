// src/app.js

import Fastify from 'fastify';

import { loggerConfig } from './plugins/logger.js';
import { registerPlugins } from './plugins/index.js';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import keysRoutes from './modules/keys/keys.routes.js';
import messageRoutes from './modules/messages/messages.routes.js';

const app = Fastify({
  logger: loggerConfig,
});

await registerPlugins(app);

await app.register(authRoutes, {
  prefix: '/api/auth',
});

await app.register(userRoutes, {
  prefix: '/api/users',
});

await app.register(keysRoutes, {
  prefix: '/api/keys',
});

await app.register(messageRoutes, {
  prefix: '/api/messages',
});

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

  const statusCode = error.statusCode || 500;

  reply.status(statusCode).send({
    success: false,
    error: error.name || 'InternalServerError',
    message:
      statusCode === 500
        ? 'Internal Server Error'
        : error.message,
  });
});

export default app;