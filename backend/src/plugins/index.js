// src/plugins/index.js

import corsPlugin from './cors.js';
import helmetPlugin from './helmet.js';
import prismaPlugin from './prisma.js';

export async function registerPlugins(app) {
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(prismaPlugin);
}