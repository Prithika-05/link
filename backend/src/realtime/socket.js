import { Server } from "socket.io";
import { env } from "../config/env.js";
import { registerSocketAuth } from "./auth.js";

import { registerPresenceGateway } from "./gateways/presence.gateway.js";
import { registerMessageGateway } from "./gateways/message.gateway.js";
import { registerReceiptHandlers } from "./gateways/receipt.gateway.js";
import { registerTypingHandlers } from "./gateways/typing.gateway.js";

import { connectionManager } from "./connection.manager.js";
import { setupRedisAdapter, closeRedisAdapter } from "./redis.adapter.js";
import { startCleanup, stopCleanup } from "./socket.rate-limit.js";

let io = null;

export async function initializeSocket(fastify) {
  if (io) {
    return io;
  }

  io = new Server(fastify.server, {
    cors: {
      origin: env.isProduction ? env.corsOrigins : true,
      credentials: true,
      methods: ["GET", "POST", "PATCH"],
    },
    transports: ["websocket"],
  });

  /* Setup Redis adapter for scaling */
  await setupRedisAdapter(io, fastify.log);

  /* Start rate limit timer */
  startCleanup();

  /* Socket authentication middleware */
  registerSocketAuth(io, fastify);

  /* Gateways setup */
  registerPresenceGateway(io, fastify);
  registerMessageGateway(io, fastify);

  io.on("connection", (socket) => {
    const userId = socket.data.user.sub;

    connectionManager.add(userId, socket);

    registerReceiptHandlers(socket, io, fastify);
    registerTypingHandlers(socket, io, fastify);

    fastify.log.debug(
      {
        socketId: socket.id,
        userId,
        publicId: socket.data.user.publicId,
      },
      "Socket connected.",
    );

    socket.on("disconnect", (reason) => {
      connectionManager.remove(userId, socket);

      fastify.log.debug(
        {
          socketId: socket.id,
          userId,
          reason,
        },
        "Socket disconnected.",
      );
    });
  });

  /* Graceful shutdown hook */
  fastify.addHook("onClose", async () => {
    stopCleanup();
    await closeRedisAdapter();
    if (io) {
      await io.close();
      io = null;
    }
    fastify.log.info("Socket.IO instance closed.");
  });

  fastify.log.info("Socket.IO initialized.");

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }
  return io;
}
