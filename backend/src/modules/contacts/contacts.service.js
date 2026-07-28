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

    const request = await this.db.query.contactRequests.findFirst({
      where: and(
        eq(contactRequests.id, requestId),
        eq(contactRequests.receiverId, receiver.id),
      ),
    });

    if (!request) throw new NotFoundError("Contact request not found.");

    const [updated] = await this.db
      .update(contactRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(contactRequests.id, requestId))
      .returning();

    return updated;
  }

  async getPendingRequests(userPublicId) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, userPublicId),
    });

    if (!user) throw new NotFoundError("User not found.");

    const [incoming, outgoing] = await Promise.all([
      // Incoming requests (people asking to add current user)
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
      // Outgoing requests (requests current user sent to others)
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

    // Delete any existing relationship or pending request between userA and userB
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
   * Get all publicIds of users who have an ACCEPTED contact relationship with current user
   */
  async getAcceptedContactPublicIds(userPublicId) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.publicId, userPublicId),
      columns: { id: true },
    });

    if (!user) throw new NotFoundError("User not found.");

    // Find all accepted requests involving this user
    const acceptedRequests = await this.db.query.contactRequests.findMany({
      where: and(
        eq(contactRequests.status, "ACCEPTED"),
        or(
          eq(contactRequests.senderId, user.id),
          eq(contactRequests.receiverId, user.id),
        ),
      ),
      with: {
        sender: { columns: { publicId: true } },
        receiver: { columns: { publicId: true } },
      },
    });

    // Extract the other person's publicId for each relationship
    const acceptedPublicIds = acceptedRequests.map((req) =>
      req.senderId === user.id ? req.receiver.publicId : req.sender.publicId,
    );

    return acceptedPublicIds;
  }
}
