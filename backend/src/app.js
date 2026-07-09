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


async function registerRoutes() {
  const routes = [
    {
      plugin: authRoutes,
      prefix: '/api/auth',
    },
    {
      plugin: userRoutes,
      prefix: '/api/users',
    },
    {
      plugin: keysRoutes,
      prefix: '/api/keys',
    },
    {
      plugin: messageRoutes,
      prefix: '/api/messages',
    },
  ];

  for (const route of routes) {
    await app.register(route.plugin, {
      prefix: route.prefix,
    });
  }
}


function registerHealthRoute() {
  app.get('/health', async () => ({
    success: true,
    message: 'Secure Chat API is running.',
    data: {
      service: 'secure-chat-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  }));
}


function registerErrorHandler() {
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode || 500;

    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message:
          statusCode >= 500
            ? 'Internal Server Error'
            : error.message,
      },
      ...(process.env.NODE_ENV !== 'production' && {
        stack: error.stack,
      }),
    });
  });
}


async function buildApp() {
  await registerPlugins(app);

  await registerRoutes();

  registerHealthRoute();

  registerErrorHandler();

  return app;
}

await buildApp();

export default app;