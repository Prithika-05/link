import { eq } from "drizzle-orm";
import { users } from "../../db/schema.js";
import { EVENTS } from "../events.js";
import { connectionManager } from "../connection.manager.js";
import { USER_STATUS } from "../../utils/constants.js";

export function registerPresenceGateway(io, fastify) {
  io.on("connection", async (socket) => {
    const userId = socket.data.user.sub;

    if (connectionManager.getSocketCount(userId) === 1) {
      try {
        await fastify.db
          .update(users)
          .set({ status: USER_STATUS.ONLINE })
          .where(eq(users.id, userId));

        io.emit(EVENTS.USER_ONLINE, {
          userId,
          publicId: socket.data.user.publicId,
        });

        fastify.log.debug({ userId }, "User came online.");
      } catch (error) {
        fastify.log.error({ userId, error }, "Failed updating user presence.");
      }
    }

    socket.on("disconnect", async (reason) => {
      if (!connectionManager.isConnected(userId)) {
        try {
          await fastify.db
            .update(users)
            .set({ status: USER_STATUS.OFFLINE })
            .where(eq(users.id, userId));

          io.emit(EVENTS.USER_OFFLINE, {
            userId,
            publicId: socket.data.user.publicId,
          });

          fastify.log.debug({ userId, reason }, "User went offline.");
        } catch (error) {
          fastify.log.error(
            { userId, error },
            "Failed updating user presence.",
          );
        }
      }
    });
  });
}
