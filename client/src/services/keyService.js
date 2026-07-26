import {apiClient} from '../api/httpClient'

export const keyService = {
    async uploadPublicKey(payload) {
        const {data} = await apiClient.post('/keys', payload)
        return data
    },

    async getPublicKey(publicId) {
    const { data } = await apiClient.get(
        `/keys/${encodeURIComponent(publicId)}`
    )

    return data.data
    },
}
