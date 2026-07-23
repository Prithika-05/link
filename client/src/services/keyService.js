import {apiClient} from '../api/httpClient'

export const keyService = {
    async uploadPublicKey(payload) {
        const {data} = await apiClient.post('/keys', payload)
        return data
    },

    async getPublicKey(userId) {
    const { data } = await apiClient.get(
        `/keys/${encodeURIComponent(userId)}`
    )

    return data.data
    },
}
