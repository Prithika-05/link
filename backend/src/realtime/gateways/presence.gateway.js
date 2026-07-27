import { eq } from "drizzle-orm";
import { users } from "../../db/schema.js";
import { EVENTS } from "../events.js";
import { connectionManager } from "../connection.manager.js";
import { USER_STATUS } from "../../utils/constants.js";

export function handleUserPresence(socket, io, fastify) {
  const userId = socket.data.user.sub;
  const publicId = socket.data.user.publicId;

  // Track socket FIRST in connectionManager
  connectionManager.add(userId, socket);

  // If this is the user's FIRST active socket connection, set them ONLINE in DB
  if (connectionManager.getSocketCount(userId) === 1) {
    fastify.db
      .update(users)
      .set({ status: USER_STATUS.ONLINE })
      .where(eq(users.id, userId))
      .then(() => {
        io.emit(EVENTS.USER_ONLINE, {
          userId,
          publicId,
        });

        fastify.log.info(
          { userId, publicId, username: socket.data.user.username },
          "User status updated to ONLINE in database.",
        );
      })
      .catch((error) => {
        fastify.log.error(
          { userId, error },
          "Failed updating user presence to ONLINE.",
        );
      });
  }

  // Handle disconnect
  socket.on("disconnect", async (reason) => {
    connectionManager.remove(userId, socket);

    // If user has no remaining sockets connected, set them OFFLINE in DB
    if (!connectionManager.isConnected(userId)) {
      try {
        await fastify.db
          .update(users)
          .set({ status: USER_STATUS.OFFLINE })
          .where(eq(users.id, userId));

        io.emit(EVENTS.USER_OFFLINE, {
          userId,
          publicId,
        });

        fastify.log.info(
          { userId, publicId, reason },
          "User status updated to OFFLINE in database.",
        );
      } catch (error) {
        fastify.log.error(
          { userId, error },
          "Failed updating user presence to OFFLINE.",
        );
      }
    }
  });
}
