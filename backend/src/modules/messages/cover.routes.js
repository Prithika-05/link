// src/modules/messages/cover.routes.js
//
// Cover traffic endpoint.
//
// Purpose: allows clients to send periodic dummy encrypted messages at fixed
// intervals. From the network perspective, cover traffic requests are
// indistinguishable from real message sends (same shape, same size range,
// same authentication, same rate limits).
//
// This defeats a maliciously curious server that would otherwise learn:
// - When Alice and Bob are actively conversing
// - How long a conversation lasts
// - Whether Alice went idle for hours vs seconds
// - Traffic correlation between users
//
// The server silently discards cover messages. The security property is that
// the server CANNOT DISTINGUISH cover from real, so it must treat all message
// timing as unreliable evidence of conversation.

import { authenticate } from "../../middlewares/auth.middleware.js";
import { sendMessageSchema } from "./messages.schema.js";

export default async function coverRoutes(fastify) {
  // We reuse the exact same schema and rate limit as the real /messages
  // endpoint. Any observable difference in schema or rate limit would let
  // the server distinguish cover traffic from real, defeating the point.
  fastify.post(
    "/cover",
    {
      preHandler: [authenticate],
      schema: sendMessageSchema,
      config: {
        rateLimit: {
          max: 120,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      // Intentionally do nothing with the payload. The request has been
      // authenticated, schema-validated, and rate-limited exactly as a real
      // message would. From the outside, this looks identical.
      //
      // We do not log the payload. We do not persist it. We do not forward it.
      // The response mirrors the real /messages response shape so an external
      // observer (or the server itself scanning response bodies) cannot tell
      // this was a cover message.

      return reply.code(201).send({
        success: true,
        // Return a fake message ID so the response shape matches real sends.
        // The ID is random and not stored anywhere.
        messageId: `cover-${request.id}`,
      });
    },
  );
}
