// src/services/keyService.js
import { apiClient } from "../api/httpClient";

export const keyService = {
  async uploadPublicKey(payload) {
    const { data } = await apiClient.post("/keys", payload);
    return data;
  },

  async getPublicKey(publicId) {
    const { data } = await apiClient.get(
      `/keys/${encodeURIComponent(publicId)}`,
    );
    return data.data;
  },

  // Save encrypted private key backup
  async uploadKeyBackup(backupPayload) {
    const { data } = await apiClient.post("/keys/backup", backupPayload);
    return data;
  },

  // Fetch my encrypted private key backup
  async getKeyBackup() {
    const { data } = await apiClient.get("/keys/backup/me");
    return data.data;
  },
};
