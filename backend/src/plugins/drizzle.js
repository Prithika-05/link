import fp from 'fastify-plugin';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema.js';
import { env } from '../config/env.js';

async function drizzlePlugin(fastify) {
  try {
    const queryClient = postgres(env.databaseUrl);
    const db = drizzle(queryClient, { schema });

    fastify.decorate('db', db);
    fastify.log.info('Connected to PostgreSQL via Drizzle ORM');

    fastify.addHook('onClose', async () => {
      await queryClient.end();
      fastify.log.info('PostgreSQL connection closed.');
    });
  } catch (error) {
    fastify.log.fatal(error);
    throw error;
  }
}

export default fp(drizzlePlugin, { name: 'db' });
