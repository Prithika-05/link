import {STORAGE_KEYS} from '../constants/storage.js'

function storageKey(ownerId) {
    return `${STORAGE_KEYS.contactsPrefix}.${ownerId}`
}

export function loadStoredContacts(ownerId) {
    if (!ownerId) return []

    try {
        const value = localStorage.getItem(storageKey(ownerId))
        return value ? JSON.parse(value) : []
    } catch (error) {
        console.error(error)
        return []
    }
}

export function saveStoredContacts(ownerId, contacts) {
    if (!ownerId) return

    const key = storageKey(ownerId)

    localStorage.setItem(key, JSON.stringify(contacts))

}