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

        const receiver = await fastify.db.query.users.findFirst({
          where: eq(users.publicId, payload.receiverId),
          columns: {
            id: true,
            publicId: true,
            status: true,
          },
        });

        if (!receiver) {
          throw new Error("Receiver not found.");
        }

        /* Required encrypted payload */
        const requiredFields = [
          "receiverId",
          "ciphertext",
          "iv",
          "authTag",
          "ephemeralPublicKey",
        ];

        for (const field of requiredFields) {
          if (!payload?.[field]) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        const message = await messageService.send(senderPublicId, {
          ...payload,
          receiverPublicId: payload.receiverId,
        });

        /* Sender acknowledgment */
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

        /* Deliver to recipient if online */
        if (connectionManager.isConnected(receiver.id)) {
          connectionManager.emit(receiver.id, EVENTS.MESSAGE_RECEIVE, message);
        }

        fastify.log.info(
          {
            messageId: message.id,
            senderPublicId,
            receiverPublicId: receiver.publicId,
          },
          "Encrypted message sent.",
        );
      } catch (error) {
        fastify.log.error(
          {
            senderPublicId: socket.data.user.publicId,
            error: error.message,
          },
          "Failed to send encrypted message.",
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
