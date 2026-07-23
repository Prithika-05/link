// src/server.js

import app from './app.js';
import { env } from './config/env.js';

import { initializeSocket } from './realtime/socket.js';
import { closeRedisAdapter } from './realtime/redis.adapter.js';

let shuttingDown = false;

async function startServer() {
  try {
    await initializeSocket(app);

    await app.listen({
      host: '0.0.0.0',
      port: env.port,
    });

    app.log.info('====================================');
    app.log.info('Secure Chat Backend Started');
    app.log.info(`Environment : ${env.nodeEnv}`);
    app.log.info(`Port        : ${env.port}`);
    app.log.info('====================================');
  } catch (error) {
    app.log.fatal(error, 'Failed to start server.');
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  app.log.info(`${signal} received. Shutting down gracefully...`);

  try {
    await closeRedisAdapter();

    await app.close();

    app.log.info('Server closed successfully.');
  } catch (error) {
    app.log.fatal(error, 'Error during shutdown.');
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));

process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  app.log.fatal(
    { reason },
    'Unhandled Promise Rejection'
  );

  shutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
  app.log.fatal(
    { err: error },
    'Uncaught Exception'
  );

  shutdown('UNCAUGHT_EXCEPTION');
});

await startServer();