import { describe, it, expect, vi } from "vitest";

import { handleUserPresence } from "../../src/realtime/gateways/presence.gateway";

describe("Presence Gateway Security", () => {
  it("should never broadcast presence globally", async () => {
    const emit = vi.fn();

    const io = {
      emit,
    };

    const socket = {
      data: {
        user: {
          sub: "internal-user-id",
          publicId: "public-user-id",
        },
      },
      on: vi.fn(),
    };

    const fastify = {
      db: {
        update: () => ({
          set: () => ({
            where: () => Promise.resolve(),
          }),
        }),
      },
      log: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      },
    };

    handleUserPresence(socket, io, fastify);

    // Wait one event loop because ONLINE notification happens in a Promise.
    await Promise.resolve();

    expect(io.emit).not.toHaveBeenCalled();
  });
});