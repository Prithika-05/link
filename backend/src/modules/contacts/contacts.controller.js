import { ContactsService } from "./contacts.service.js";
import { successResponse } from "../../utils/response.js";
// 1. Directly import the singleton instance
import { connectionManager } from "../../realtime/connection.manager.js";

export class ContactsController {
  constructor(fastify) {
    this.fastify = fastify;
    this.contactsService = new ContactsService(fastify);
  }

  sendRequest = async (request, reply) => {
    const { receiverPublicId } = request.body;
    const result = await this.contactsService.sendRequest(
      request.user.publicId,
      receiverPublicId,
    );

    if (connectionManager.isConnected(result.receiverUser.publicId)) {
      connectionManager.emit(
        result.receiverUser.publicId,
        "contact_request:received",
        {
          requestId: result.request.id,
          sender: {
            publicId: result.senderUser.publicId,
            username: result.senderUser.username,
            displayName: result.senderUser.displayName,
            email: result.senderUser.email,
          },
        },
      );
    }

    return successResponse(
      reply,
      result.request,
      "Contact request sent successfully.",
    );
  };

  respond = async (request, reply) => {
    const { requestId, action } = request.body; // action: "ACCEPTED" | "REJECTED"
    const result = await this.contactsService.respondToRequest(
      request.user.publicId,
      requestId,
      action,
    );

    // 3. Match publicId across both connection check and emit payload
    if (
      result.senderUser &&
      connectionManager.isConnected(result.senderUser.publicId)
    ) {
      if (action === "ACCEPTED") {
        connectionManager.emit(
          result.senderUser.publicId,
          "contact_request:accepted",
          {
            requestId: result.updated.id,
            contact: {
              publicId: result.receiverUser.publicId,
              username: result.receiverUser.username,
              displayName: result.receiverUser.displayName,
              email: result.receiverUser.email,
            },
          },
        );
      } else if (action === "REJECTED") {
        connectionManager.emit(
          result.senderUser.publicId,
          "contact_request:rejected",
          {
            requestId: result.updated.id,
            receiverPublicId: result.receiverUser.publicId,
          },
        );
      }
    }

    return successResponse(
      reply,
      result.updated,
      `Contact request ${action.toLowerCase()}.`,
    );
  };

  getPending = async (request, reply) => {
    const pending = await this.contactsService.getPendingRequests(
      request.user.publicId,
    );
    return successResponse(reply, pending, "Pending requests retrieved.");
  };

  deleteContact = async (request, reply) => {
    const { targetPublicId } = request.params;
    const result = await this.contactsService.deleteContact(
      request.user.publicId,
      targetPublicId,
    );

    return successResponse(reply, null, result.message);
  };

  getAcceptedContacts = async (request, reply) => {
    const acceptedPublicIds =
      await this.contactsService.getAcceptedContactPublicIds(
        request.user.publicId,
      );
    return successResponse(
      reply,
      acceptedPublicIds,
      "Accepted contact IDs retrieved.",
    );
  };
}
