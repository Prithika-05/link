import { EVENTS } from "../events.js";
import { connectionManager } from "../connection.manager.js";
import { MessageService } from "../../modules/messages/messages.service.js";

export function registerReceiptHandlers(socket, fastify) {
  const messageService = new MessageService(fastify);

  /**
   * Message delivered receipt handler
   */
  socket.on(EVENTS.MESSAGE_DELIVERED, async ({ messageId }, callback) => {
    try {
      if (!messageId) {
        throw new Error("Message ID is required.");
      }

      const message = await messageService.markDelivered(
        messageId,
        socket.data.user.publicId,
      );

      connectionManager.emit(message.senderPublicId, EVENTS.MESSAGE_DELIVERED, {
        messageId: message.id,
        status: message.status,
        receiverPublicId: socket.data.user.publicId,
      });

      if (typeof callback === "function") {
        callback({
          success: true,
          data: {
            messageId: message.id,
            status: message.status,
          },
        });
      }

      fastify.log.debug(
        {
          messageId: message.id,
          receiverPublicId: socket.data.user.publicId,
        },
        "Message marked as delivered.",
      );
    } catch (error) {
      fastify.log.error(
        { error: error.message },
        "Failed to mark message as delivered.",
      );

      if (typeof callback === "function") {
        callback({
          success: false,
          message: error.message,
        });
      }
    }
  });

  /**
   * Message read receipt handler
   */
  socket.on(EVENTS.MESSAGE_READ, async ({ messageId }, callback) => {
    try {
      if (!messageId) {
        throw new Error("Message ID is required.");
      }

      const message = await messageService.markRead(
        messageId,
        socket.data.user.publicId,
      );

      connectionManager.emit(message.senderPublicId, EVENTS.MESSAGE_READ, {
        messageId: message.id,
        status: message.status,
        receiverPublicId: socket.data.user.publicId,
      });

      if (typeof callback === "function") {
        callback({
          success: true,
          data: {
            messageId: message.id,
            status: message.status,
          },
        });
      }

      fastify.log.debug(
        {
          messageId: message.id,
          receiverPublicId: socket.data.user.publicId,
        },
        "Message marked as read.",
      );
    } catch (error) {
      fastify.log.error(
        { error: error.message },
        "Failed to mark message as read.",
      );

      if (typeof callback === "function") {
        callback({
          success: false,
          message: error.message,
        });
      }
    }
  });
}
