import { vi } from "vitest";
import { SECURITY_FIXTURES } from "./security.fixtures.js";

export function createMockFastify() {
  // Create a reusable fluent chain mock for update queries
  const mockUpdateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockImplementation(() => Promise.resolve(true))
  };

  return {
    db: {
      // 1. Add the missing fluent update chain stub
      update: vi.fn(() => mockUpdateChain),
      
      // 2. Core query mappings for database projections
      query: {
        users: {
          findMany: vi.fn().mockImplementation((options) => {
            const target = SECURITY_FIXTURES.users.vulnerableTarget;
            
            if (options && options.columns) {
              const projectedRow = {};
              Object.keys(options.columns).forEach((key) => {
                if (options.columns[key] && target[key] !== undefined) {
                  projectedRow[key] = target[key];
                }
              });
              return Promise.resolve([projectedRow]);
            }
            return Promise.resolve([ { ...target } ]);
          })
        },
        contactRequests: {
          findMany: vi.fn().mockImplementation(() => {
            // Return an array with the accepted relation from fixtures
            return Promise.resolve([SECURITY_FIXTURES.contacts.acceptedRelation]);
          })
        }
      },
      
      // 3. Selection builder stub for aggregation actions
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ total: 1 }])
        }))
      }))
    },
    log: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }
  };
}
