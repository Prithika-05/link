import { eq } from "drizzle-orm";
import { users } from "../../db/schema.js";
import { EVENTS } from "../events.js";
import { connectionManager } from "../connection.manager.js";
import { MessageService } from "../../modules/messages/messages.service.js";
import { MESSAGE_STATUS } from "../../utils/constants.js";

export function registerMessageGateway(io, fastify) {
  const messageService = new MessageService(fastify);

  io.on("connection", (socket) => {
    socket.on(EVENTS.MESSAGE_SEND, async (payload, callback) => {
      try {
        const senderPublicId = socket.data.user.publicId;
        const targetPublicId = payload.receiverPublicId;

        if (!targetPublicId) {
          throw new Error("Receiver ID is missing.");
        }

        // Save message to DB & Redis (handles replay protection)
        const message = await messageService.send(senderPublicId, {
          ...payload,
          receiverPublicId: targetPublicId,
        });

        // Sender socket acknowledgment (CRITICAL: MUST EXECUTE)
        if (typeof callback === "function") {
          callback({
            success: true,
            data: {
              messageId: message.id,
              status: MESSAGE_STATUS.SENT,
              timestamp: message.createdAt,
            },
          });
        }

        // Change this section in registerMessageGateway:

        const receiver = await fastify.db.query.users.findFirst({
          where: eq(users.publicId, targetPublicId),
          columns: { id: true, publicId: true },
        });

        if (receiver && connectionManager.isConnected(receiver.publicId)) {
          connectionManager.emit(receiver.publicId, EVENTS.MESSAGE_RECEIVE, {
            ...message,
            senderPublicId,
            receiverPublicId: receiver.publicId,
          });
        }
      } catch (error) {
        fastify.log.error(
          { error: error.message },
          "Failed sending message via socket.",
        );

        if (typeof callback === "function") {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    });
  });
}
