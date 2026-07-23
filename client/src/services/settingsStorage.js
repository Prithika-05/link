import {STORAGE_KEYS} from '../constants/storage.js'

const defaults = {
    desktopNotifications: true,
    soundEnabled: true,
    enterToSend: true,
    theme: 'light',
}

export function loadStoredSettings() {
    try {
        const value = window.localStorage.getItem(STORAGE_KEYS.settings)
        return value ? {...defaults, ...JSON.parse(value)} : defaults
    } catch {
        return defaults
    }
}

export function saveStoredSettings(settings) {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
}
