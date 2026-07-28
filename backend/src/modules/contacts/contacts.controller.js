// src/modules/contacts/contacts.controller.js

import { ContactsService } from "./contacts.service.js";
import { successResponse } from "../../utils/response.js";

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

    const connectionManager =
      this.fastify.connectionManager || this.fastify.io?.connectionManager;

    if (
      connectionManager &&
      connectionManager.isConnected(result.receiverUser.id)
    ) {
      connectionManager.emit(
        result.receiverUser.id,
        "contact_request:received",
        {
          requestId: result.request.id,
          sender: {
            publicId: result.senderUser.publicId,
            username: result.senderUser.username,
            displayName: result.senderUser.displayName,
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

    return successResponse(
      reply,
      result,
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
