import { eq } from "drizzle-orm";
import { users } from "../../db/schema.js";
import { EVENTS } from "../events.js";
import { connectionManager } from "../connection.manager.js";
import { USER_STATUS } from "../../utils/constants.js";

// Map to hold pending offline timeouts for reconnecting users
const pendingDisconnects = new Map();

export function handleUserPresence(socket, io, fastify) {
  const userId = socket.data.user.sub;
  const publicId = socket.data.user.publicId;

  // 1. Cancel any pending "OFFLINE" timer if the user reconnected quickly
  if (pendingDisconnects.has(userId)) {
    clearTimeout(pendingDisconnects.get(userId));
    pendingDisconnects.delete(userId);
    fastify.log.debug(
      { userId },
      "Pending offline timer cancelled (user reconnected).",
    );
  }

  // 2. Add connection
  connectionManager.add(userId, socket);

  // 3. Set ONLINE in DB if first socket
  if (connectionManager.getSocketCount(userId) === 1) {
    fastify.db
      .update(users)
      .set({ status: USER_STATUS.ONLINE })
      .where(eq(users.id, userId))
      .then(() => {
        io.emit(EVENTS.USER_ONLINE, { userId, publicId });
        fastify.log.info({ userId, publicId }, "User status set to ONLINE.");
      })
      .catch((error) => {
        fastify.log.error({ userId, error }, "Failed setting user to ONLINE.");
      });
  }

  // 4. Handle Disconnect with a Grace Period
  socket.on("disconnect", (reason) => {
    connectionManager.remove(userId, socket);

    // If user has no sockets left, wait 4 seconds before marking them offline in DB
    if (!connectionManager.isConnected(userId)) {
      const timer = setTimeout(async () => {
        // Re-check if they are still disconnected after 4 seconds
        if (!connectionManager.isConnected(userId)) {
          try {
            await fastify.db
              .update(users)
              .set({ status: USER_STATUS.OFFLINE })
              .where(eq(users.id, userId));

            io.emit(EVENTS.USER_OFFLINE, { userId, publicId });
            fastify.log.info(
              { userId, publicId, reason },
              "User status set to OFFLINE.",
            );
          } catch (error) {
            fastify.log.error(
              { userId, error },
              "Failed setting user to OFFLINE.",
            );
          } finally {
            pendingDisconnects.delete(userId);
          }
        }
      }, 4000); // 4-second grace period for page refreshes / tab switches

      pendingDisconnects.set(userId, timer);
    }
  });
}
