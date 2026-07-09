// src/server.js

import app from './app.js';
import { env } from './config/env.js';

import { initializeSocket } from './realtime/socket.js';
import { closeRedisAdapter } from './realtime/redis.adapter.js';

let shuttingDown = false;


async function startServer() {
  try {
    await app.listen({
      port: env.port,
      host: '0.0.0.0',
    });

    await initializeSocket(app);

    app.log.info('====================================');
    app.log.info('Secure Chat Backend Started');
    app.log.info(`Environment : ${env.nodeEnv}`);
    app.log.info(`Port        : ${env.port}`);
    app.log.info('====================================');
  } catch (error) {
    app.log.fatal(error);

    process.exit(1);
  }
}

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  app.log.info(`${signal} received. Shutting down...`);

  try {
    await closeRedisAdapter();

    await app.close();

    app.log.info('✅ Server stopped successfully.');

    process.exit(0);
  } catch (error) {
    app.log.fatal(error);

    process.exit(1);
  }
}


process.on('SIGINT', () => shutdown('SIGINT'));

process.on('SIGTERM', () => shutdown('SIGTERM'));


process.on('unhandledRejection', (reason) => {
  app.log.fatal(reason);

  shutdown('UNHANDLED_REJECTION');
});


process.on('uncaughtException', (error) => {
  app.log.fatal(error);

  shutdown('UNCAUGHT_EXCEPTION');
});

await startServer();