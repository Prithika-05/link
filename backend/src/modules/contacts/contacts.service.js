import { eq, and, or } from "drizzle-orm";
import { contactRequests, users } from "../../db/schema.js";
import { NotFoundError, ValidationError } from "../../error.js";

export class ContactsService {
  constructor(fastify) {
    this.db = fastify.db;
  }

  async isContactAccepted(userAId, userBId) {
    const record = await this.db.query.contactRequests.findFirst({
      where: and(
        eq(contactRequests.status, "ACCEPTED"),
        or(
          and(
            eq(contactRequests.senderId, userAId),
            eq(contactRequests.receiverId, userBId),
          ),
          and(
            eq(contactRequests.senderId, userBId),
            eq(contactRequests.receiverId, userAId),
          ),
        ),
      ),
    });
    return !!record;
  }

  async sendRequest(senderPublicId, receiverPublicId) {
    const [sender, receiver] = await Promise.all([
      this.db.query.users.findFirst({
        where: eq(users.publicId, senderPublicId),
      }),
      this.db.query.users.findFirst({
        where: eq(users.publicId, receiverPublicId),
      }),
    ]);

    if (!sender || !receiver) throw new NotFoundError("User not found.");
    if (sender.id === receiver.id)
      throw new ValidationError("You cannot add yourself.");

    const existing = await this.db.query.contactRequests.findFirst({
      where: or(
        and(
          eq(contactRequests.senderId, sender.id),
          eq(contactRequests.receiverId, receiver.id),
        ),
        and(
          eq(contactRequests.senderId, receiver.id),
          eq(contactRequests.receiverId, sender.id),
        ),
      ),
    });

    if (existing) {
      if (existing.status === "ACCEPTED")
        throw new ValidationError("Already contacts.");
      if (existing.status === "PENDING")
        throw new ValidationError("Request is already pending.");

      // If previous request was REJECTED or unlinked, update it back to PENDING with new sender
      const [updated] = await this.db
        .update(contactRequests)
        .set({
          senderId: sender.id,
          receiverId: receiver.id,
          status: "PENDING",
          updatedAt: new Date(),
        })
        .where(eq(contactRequests.id, existing.id))
        .returning();

      return { request: updated, receiverUser: receiver, senderUser: sender };
    }

    const [request] = await this.db
      .insert(contactRequests)
      .values({
        senderId: sender.id,
        receiverId: receiver.id,
        status: "PENDING",
      })
      .returning();

    return { request, receiverUser: receiver, senderUser: sender };
  }

  async respondToRequest(receiverPublicId, requestId, status) {
    const receiver = await this.db.query.users.findFirst({
      where: eq(users.publicId, receiverPublicId),
    });

    if (!receiver) throw new NotFoundError("User not found.");

    const request = await this.db.query.contactRequests.findFirst({
      where: and(
        eq(contactRequests.id, requestId),
        eq(contactRequests.receiverId, receiver.id),
      ),
      with: {
        sender: true,
      },
    });

    if (!request) throw new NotFoundError("Contact request not found.");

    const [updated] = await this.db
      .update(contactRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(contactRequests.id, requestId))
      .returning();

    return {
      updated,
      senderUser: request.sender,
      receiverUser: receiver,
    };
  }

  async getPendingRequests(userPublicId) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, userPublicId),
    });

    if (!user) throw new NotFoundError("User not found.");

    const [incoming, outgoing] = await Promise.all([
      // Incoming requests
      this.db.query.contactRequests.findMany({
        where: and(
          eq(contactRequests.receiverId, user.id),
          eq(contactRequests.status, "PENDING"),
        ),
        with: {
          sender: {
            columns: {
              publicId: true,
              username: true,
              displayName: true,
              email: true,
            },
          },
        },
      }),
      // Outgoing requests
      this.db.query.contactRequests.findMany({
        where: eq(contactRequests.senderId, user.id),
        with: {
          receiver: {
            columns: {
              publicId: true,
              username: true,
              displayName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return { incoming, outgoing };
  }

  async deleteContact(userAPublicId, userBPublicId) {
    const [userA, userB] = await Promise.all([
      this.db.query.users.findFirst({
        where: eq(users.publicId, userAPublicId),
        columns: { id: true },
      }),
      this.db.query.users.findFirst({
        where: eq(users.publicId, userBPublicId),
        columns: { id: true },
      }),
    ]);

    if (!userA || !userB) {
      throw new NotFoundError("User not found.");
    }

    // Delete ONLY the contact relationship record from PostgreSQL.
    // Messages in the `messages` table are kept intact in the database!
    await this.db
      .delete(contactRequests)
      .where(
        or(
          and(
            eq(contactRequests.senderId, userA.id),
            eq(contactRequests.receiverId, userB.id),
          ),
          and(
            eq(contactRequests.senderId, userB.id),
            eq(contactRequests.receiverId, userA.id),
          ),
        ),
      );

    return { message: "Contact removed successfully." };
  }

  /**
   * Safely get all publicIds of users who have an ACCEPTED contact relationship
   */
  async getAcceptedContactPublicIds(userPublicId) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, userPublicId),
      columns: { id: true },
    });

    if (!user) throw new NotFoundError("User not found.");

    const acceptedRequests = await this.db.query.contactRequests.findMany({
      where: and(
        eq(contactRequests.status, "ACCEPTED"),
        or(
          eq(contactRequests.senderId, user.id),
          eq(contactRequests.receiverId, user.id),
        ),
      ),
      with: {
        sender: { columns: { id: true, publicId: true } },
        receiver: { columns: { id: true, publicId: true } },
      },
    });

    const acceptedPublicIds = acceptedRequests
      .map((req) => {
        if (req.senderId === user.id || req.sender?.id === user.id) {
          return req.receiver?.publicId;
        }
        return req.sender?.publicId;
      })
      .filter(Boolean);

    return acceptedPublicIds;
  }
}
