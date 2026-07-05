// src/plugins/jwt.js

import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env.js';

async function jwtPlugin(fastify) {
  await fastify.register(fastifyJwt, {
    secret: env.jwtSecret,
    sign: {
      expiresIn: '1h',
    },
  });
}

export default fp(jwtPlugin, {
  name: 'jwt',
});