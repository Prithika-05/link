import {apiClient} from '../api/httpClient'

export const userService = {
    async getCurrentUser() {
        const {data} = await apiClient.get('/users/me')
        return data.data
    },
}
