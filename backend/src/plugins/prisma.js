// src/plugins/prisma.js

import fp from 'fastify-plugin';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { env } from '../config/env.js';

const adapter = new PrismaPg({
  connectionString: env.databaseUrl,
});

const prisma = new PrismaClient({
  adapter,

  log:
    env.nodeEnv === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
});

/**
 * Fastify Prisma plugin.
 *
 * @param {import('fastify').FastifyInstance} fastify
 */
async function prismaPlugin(fastify) {
  try {
    await prisma.$connect();

    fastify.decorate('prisma', prisma);

    fastify.log.info('✅ Connected to PostgreSQL');
  } catch (error) {
    fastify.log.fatal(error);

    throw error;
  }

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();

    fastify.log.info('📦 PostgreSQL connection closed.');
  });
}

export default fp(prismaPlugin, {
  name: 'prisma',
});