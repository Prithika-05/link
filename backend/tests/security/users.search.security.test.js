import { describe, it, expect, vi } from "vitest";

vi.mock("../../../src/modules/audit/audit.service.js", () => ({
  AuditService: vi.fn().mockImplementation(() => ({
    log: vi.fn(),
  })),
}));

vi.mock("../../../src/utils/pagination.js", () => ({
  getPagination: () => ({
    page: 1,
    limit: 10,
    skip: 0,
  }),
  buildPagination: (page, limit, total) => ({
    page,
    limit,
    total,
    pages: 1,
  }),
}));

import { UsersService } from "../../../src/modules/users/users.service.js";

describe("UsersService.searchUsers()", () => {
  it("should never request private user fields from the database", async () => {
    const findMany = vi.fn().mockImplementation((options) => {
      // This is the regression check.
      // It FAILS while the vulnerability exists.
      expect(options.columns.email).toBeUndefined();
      expect(options.columns.avatarUrl).toBeUndefined();
      expect(options.columns.status).toBeUndefined();

      return [];
    });

    const fastify = {
      db: {
        query: {
          users: {
            findMany,
          },
        },
        select: () => ({
          from: () => ({
            where: async () => [{ total: 0 }],
          }),
        }),
      },
    };

    const service = new UsersService(fastify);

    await service.searchUsers("current-user", "alice", 1, 10);
  });
});