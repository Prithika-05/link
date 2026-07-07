const configuredUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
const normalizedUrl = configuredUrl.trim().replace(/\/+$/, '')
const backendUrl = normalizedUrl.endsWith('/api')
    ? normalizedUrl.slice(0, -4)
    : normalizedUrl

export const environment = Object.freeze({
    backendUrl,
    apiBaseUrl: `${backendUrl}/api`,
    socketUrl: backendUrl,
    requestTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS) || 15000,
})
