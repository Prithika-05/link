import {STORAGE_KEYS} from '../constants/storage.js'

function storageKey(ownerId) {
    return `${STORAGE_KEYS.contactsPrefix}.${ownerId}`
}

export function loadStoredContacts(ownerId) {
    if (!ownerId) return []

    try {
        const value = window.localStorage.getItem(storageKey(ownerId))
        return value ? JSON.parse(value) : []
    } catch {
        return []
    }
}

export function saveStoredContacts(ownerId, contacts) {
    if (!ownerId) return
    window.localStorage.setItem(storageKey(ownerId), JSON.stringify(contacts))
}
