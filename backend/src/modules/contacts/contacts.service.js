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

    const requests = await this.db.query.contactRequests.findMany({
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
    });

    return requests;
  }
}
