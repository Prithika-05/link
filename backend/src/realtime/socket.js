import { Server } from "socket.io";
import { env } from "../config/env.js";
import { registerSocketAuth } from "./auth.js";

import { handleUserPresence } from "./gateways/presence.gateway.js";
import { registerMessageGateway } from "./gateways/message.gateway.js";
import { registerReceiptHandlers } from "./gateways/receipt.gateway.js";
import { registerTypingHandlers } from "./gateways/typing.gateway.js";

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

  await setupRedisAdapter(io, fastify.log);
  startCleanup();

  registerSocketAuth(io, fastify);

  // Register socket listeners
  registerMessageGateway(io, fastify);

  io.on("connection", (socket) => {
    // 1. Handle presence & connection tracking in one place
    handleUserPresence(socket, io, fastify);

    // 2. Register real-time handlers for this socket
    registerReceiptHandlers(socket, io, fastify);
    registerTypingHandlers(socket, io, fastify);

    fastify.log.debug(
      {
        socketId: socket.id,
        userId: socket.data.user.sub,
        publicId: socket.data.user.publicId,
      },
      "Socket connected.",
    );
  });

  fastify.addHook("onClose", async () => {
    stopCleanup();
    await closeRedisAdapter();
    if (io) {
      await io.close();
      io = null;
    }
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
