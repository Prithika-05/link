import axios from 'axios'
import {environment} from '../config/environment'
import {clearStoredToken, getStoredToken} from '../services/tokenStorage'

export const apiClient = axios.create({
    baseURL: environment.apiBaseUrl,
    timeout: environment.requestTimeoutMs,
    headers: {
        'Content-Type': 'application/json',
    },
})

export const backendClient = axios.create({
    baseURL: environment.backendUrl,
    timeout: environment.requestTimeoutMs,
})

apiClient.interceptors.request.use((config) => {
    const token = getStoredToken()

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status
        const requestUrl = error?.config?.url || ''
        const isAuthenticationRequest =
            requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')

        if (status === 401 && !isAuthenticationRequest) {
            clearStoredToken()
            window.dispatchEvent(new CustomEvent('Link Chat :unauthorized'))
        }

        return Promise.reject(error)
    },
)
