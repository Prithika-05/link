// src/plugins/prisma.js

import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
});

async function prismaPlugin(fastify) {
  // Make Prisma available throughout the app
  fastify.decorate('prisma', prisma);

  // Verify database connectivity
  await prisma.$connect();

  fastify.log.info('✅ Connected to PostgreSQL');

  // Gracefully close the database connection
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
    fastify.log.info('📦 Prisma disconnected');
  });
}

export default fp(prismaPlugin, {
  name: 'prisma',
});