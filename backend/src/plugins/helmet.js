// src/plugins/helmet.js

import fp from 'fastify-plugin';
import fastifyHelmet from '@fastify/helmet';

async function helmetPlugin(fastify) {
  await fastify.register(fastifyHelmet, {
    global: true,

    contentSecurityPolicy: false,

    crossOriginEmbedderPolicy: false,
  });
}

export default fp(helmetPlugin);