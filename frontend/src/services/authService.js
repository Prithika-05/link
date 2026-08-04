import { apiClient } from "../api/httpClient";

export const authService = {
  async register(payload) {
    const { data } = await apiClient.post("/auth/register", payload);
    return data;
  },

  async login(payload) {
    const { data } = await apiClient.post("/auth/login", payload);
    return data;
  },

  async logout(refreshToken = null) {
    const { data } = await apiClient.post("/auth/logout", {
      ...(refreshToken && { refreshToken }),
    });
    return data;
  },
};
