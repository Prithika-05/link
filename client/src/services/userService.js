import {apiClient} from '../../../../test/src/api/httpClient.js'

export const userService = {
    async getCurrentUser() {
        const {data} = await apiClient.get('/users/me')
        return data.user
    },
}
