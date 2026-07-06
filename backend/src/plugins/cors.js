// src/plugins/cors.js

import fp from 'fastify-plugin';
import fastifyCors from '@fastify/cors';

async function corsPlugin(fastify) {
  await fastify.register(fastifyCors, {
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-domain.com']
        : true,

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  });
}

export default fp(corsPlugin);