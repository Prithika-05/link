import { describe, it, expect, vi } from "vitest";
import { UsersService } from "../../src/modules/users/users.service.js";
import { createMockFastify } from "./fixtures/mock-factory.js";

describe("Security Test Suite - User Profile Invariant Protection", () => {
  it("MUST block unauthenticated requests from accessing private settings", async () => {
    const mockFastify = createMockFastify();
    const service = new UsersService(mockFastify);

    // Act as an anonymous context query request engine
    const profileResult = await service.searchUsers(null, "alice_leak", 1, 10);
    
    profileResult.users.forEach((user) => {
      expect(user).not.toHaveProperty("email");
      expect(user).not.toHaveProperty("passwordHash");
    });
  });
});
