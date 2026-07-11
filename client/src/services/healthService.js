import {backendClient} from '../../../../test/src/api/httpClient.js'

export const healthService = {
    async check() {
        const {data} = await backendClient.get('/health')
        return data
    },
}
