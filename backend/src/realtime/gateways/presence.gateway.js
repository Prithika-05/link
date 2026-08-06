import { eq, and, or, inArray } from "drizzle-orm";
import { users, contactRequests } from "../../db/schema.js";
import { EVENTS } from "../events.js";
import { connectionManager } from "../connection.manager.js";
import { USER_STATUS } from "../../utils/constants.js";

// Map to hold pending offline timeouts for reconnecting users
const pendingDisconnects = new Map();

/**
 * Fetches the user IDs of all accepted contacts for a given user.
 * Built to prevent information disclosure during presence updates.
 */
async function getAcceptedContacts(db, userId) {
  const contacts = await db.query.contactRequests.findMany({
    where: and(
      or(
        eq(contactRequests.senderId, userId),
        eq(contactRequests.receiverId, userId)
      ),
      eq(contactRequests.status, "ACCEPTED")
    ),
  });

  return contacts.map((contact) =>
    contact.senderId === userId ? contact.receiverId : contact.senderId
  );
}

/**
 * Standardized utility to safely push presence changes only to accepted contacts' sockets.
 * Removes internal identifiers from payloads entirely and safely resolves internal
 * target IDs to public identifiers prior to connectionManager socket discovery.
 */
async function notifyContacts(fastify, event, userId, publicId) {
  try {
    const internalContactIds = await getAcceptedContacts(fastify.db, userId);
    
    if (internalContactIds.length === 0) return;

    // Translate internal database IDs to publicIds to align with connectionManager keys
    const contactUsers = await fastify.db
      .select({ publicId: users.publicId })
      .from(users)
      .where(inArray(users.id, internalContactIds));

    for (const contact of contactUsers) {
      // Look up existing active sockets using connection manager by publicId standard
      const sockets = connectionManager.get(contact.publicId);
      if (!sockets) continue;

      for (const socket of sockets) {
        socket.emit(event, { publicId });
      }
    }
  } catch (error) {
    fastify.log.error(
      { userId, error, event },
      "Failed to notify accepted contacts of presence update."
    );
  }
}

export function handleUserPresence(socket, io, fastify) {
  const userId = socket.data.user.sub;
  const publicId = socket.data.user.publicId || socket.data.user.sub; // Ensure fallback

  // 1. Cancel any pending "OFFLINE" timer if the user reconnected quickly
  if (pendingDisconnects.has(publicId)) {
    clearTimeout(pendingDisconnects.get(publicId));
    pendingDisconnects.delete(publicId);
    fastify.log.debug(
      { userId, publicId },
      "Pending offline timer cancelled (user reconnected)."
    );
  }

  // 2. Add connection indexed strictly by publicId matching project specifications
  connectionManager.add(publicId, socket);

  // 3. Set ONLINE in DB if first socket
  if (connectionManager.getSocketCount(publicId) === 1) {
    fastify.db
      .update(users)
      .set({ status: USER_STATUS.ONLINE })
      .where(eq(users.id, userId))
      .then(async () => {
        fastify.log.info({ userId, publicId }, "User status set to ONLINE.");
        await notifyContacts(fastify, EVENTS.USER_ONLINE, userId, publicId);
      })
      .catch((error) => {
        fastify.log.error({ userId, error }, "Failed setting user to ONLINE.");
      });
  }

  // 4. Handle Disconnect with a Grace Period
  socket.on("disconnect", (reason) => {
    // Remove connection using publicId standard
    connectionManager.remove(publicId, socket);

    // If user has no sockets left, wait 4 seconds before marking them offline in DB
    if (!connectionManager.isConnected(publicId)) {
      const timer = setTimeout(async () => {
        // Re-check if they are still disconnected after 4 seconds
        if (!connectionManager.isConnected(publicId)) {
          try {
            await fastify.db
              .update(users)
              .set({ status: USER_STATUS.OFFLINE })
              .where(eq(users.id, userId));

            fastify.log.info(
              { userId, publicId, reason },
              "User status set to OFFLINE."
            );
            
            await notifyContacts(fastify, EVENTS.USER_OFFLINE, userId, publicId);
          } catch (error) {
            fastify.log.error(
              { userId, error },
              "Failed setting user to OFFLINE."
            );
          } finally {
            pendingDisconnects.delete(publicId);
          }
        }
      }, 4000); // 4-second grace period for page refreshes / tab switches

      pendingDisconnects.set(publicId, timer);
    }
  });
}
