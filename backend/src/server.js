// src/server.js

import app from './app.js';
import { env } from './config/env.js';

const startServer = async () => {
  try {
    await app.listen({
    port: env.port,
    host: '0.0.0.0',
  });

  const { initializeSocket } = await import(
    './realtime/socket.js'
  );

  await initializeSocket(app);

    app.log.info(`Server running on port ${env.port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  app.log.info(`${signal} received. Shutting down gracefully...`);

  try {
    await app.close();
    app.log.info('Server closed successfully.');
    process.exit(0);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();