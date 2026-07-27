import { apiClient } from "../api/httpClient";

export const userService = {
  async getCurrentUser() {
    const { data } = await apiClient.get("/users/me");
    return data.data;
  },

  /**
   * Search users by username or email.
   */
  async searchUsers(query, page = 1, limit = 20) {
    const { data } = await apiClient.get("/users/search", {
      params: { q: query, page, limit },
    });
    return data.data; // Returns { users: [...], pagination: {...} }
  },
};
