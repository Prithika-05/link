import {apiClient} from '../api/httpClient'

export const messageService = {
    async sendMessage(payload) {
        const {data} = await apiClient.post('/messages', payload)
        return data
    },

    async getConversation(userId, {page = 1, limit = 50} = {}) {
        const {data} = await apiClient.get(
            `/messages/${encodeURIComponent(userId)}`,
            {params: {page, limit}},
        )

        return data
    },
}
