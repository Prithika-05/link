import { authenticate } from "../../middlewares/auth.middleware.js";
import { ContactsController } from "./contacts.controller.js";

export default async function contactsRoutes(fastify) {
  const controller = new ContactsController(fastify);

  fastify.post(
    "/requests",
    { preHandler: [authenticate] },
    controller.sendRequest,
  );
  fastify.post(
    "/requests/respond",
    { preHandler: [authenticate] },
    controller.respond,
  );
  fastify.get(
    "/requests/pending",
    { preHandler: [authenticate] },
    controller.getPending,
  );

  fastify.delete(
    "/:targetPublicId",
    { preHandler: [authenticate] },
    controller.deleteContact,
  );

  fastify.get(
    "/accepted",
    { preHandler: [authenticate] },
    controller.getAcceptedContacts,
  );
}
