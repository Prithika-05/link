// src/realtime/redis.adapter.js

import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

import { env } from '../config/env.js';

let pubClient = null;
let subClient = null;

export async function setupRedisAdapter(io, logger) {
  if (pubClient?.isOpen && subClient?.isOpen) {
    return;
  }

  pubClient = createClient({
    url: env.redisUrl,
  });

  subClient = pubClient.duplicate();

  pubClient.on('error', (error) => {
    logger.error(
      { error },
      'Socket.IO Redis publisher error.'
    );
  });

  subClient.on('error', (error) => {
    logger.error(
      { error },
      'Socket.IO Redis subscriber error.'
    );
  });

  await Promise.all([
    pubClient.connect(),
    subClient.connect(),
  ]);

  io.adapter(createAdapter(pubClient, subClient));

  logger.info('Socket.IO Redis adapter initialized.');
}

export async function closeRedisAdapter() {
  await Promise.all([
    pubClient?.isOpen ? pubClient.quit() : Promise.resolve(),
    subClient?.isOpen ? subClient.quit() : Promise.resolve(),
  ]);

  pubClient = null;
  subClient = null;
}