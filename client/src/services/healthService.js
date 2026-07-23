import {backendClient} from '../api/httpClient'

export const healthService = {
    async check() {
        const {data} = await backendClient.get('/health')
        return data
    },
}
