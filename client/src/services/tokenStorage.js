import { STORAGE_KEYS } from '../constants/storage.js'

export function getStoredToken() {
    return (
        window.localStorage.getItem(STORAGE_KEYS.persistentToken) ||
        window.sessionStorage.getItem(STORAGE_KEYS.sessionToken)
    )
}

export function saveToken(accessToken, remember = false) {
    clearStoredToken()

    const storage = remember
        ? window.localStorage
        : window.sessionStorage

    const key = remember
        ? STORAGE_KEYS.persistentToken
        : STORAGE_KEYS.sessionToken

    storage.setItem(key, accessToken)
}

export function clearStoredToken() {
    window.localStorage.removeItem(STORAGE_KEYS.persistentToken)
    window.sessionStorage.removeItem(STORAGE_KEYS.sessionToken)
}