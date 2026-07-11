import {apiClient} from '../../../../test/src/api/httpClient.js'

export const keyService = {
    async uploadPublicKey(payload) {
        const {data} = await apiClient.post('/keys', payload)
        return data
    },

    async getPublicKey(userId) {
        const {data} = await apiClient.get(`/keys/${encodeURIComponent(userId)}`)
        return data.publicKey
    },
}
