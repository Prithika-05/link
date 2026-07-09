// src/realtime/redis.adapter.js

import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { env } from '../config/env.js';


let pubClient;
let subClient;

export async function setupRedisAdapter(io, logger) {
  pubClient = createClient({
    url: env.redisUrl,
  });

  subClient = pubClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));

  logger.info('Socket.IO Redis Adapter initialized');
}

export async function closeRedisAdapter() {
  if (pubClient?.isOpen) {
    await pubClient.quit();
  }

  if (subClient?.isOpen) {
    await subClient.quit();
  }
}