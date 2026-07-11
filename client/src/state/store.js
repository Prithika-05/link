import {configureStore} from '@reduxjs/toolkit'
import authReducer from './features/auth/authSlice'
import contactsReducer from './features/contacts/contactsSlice'
import messagesReducer from './features/messages/messagesSlice'
import settingsReducer from './features/settings/settingsSlice'
import systemReducer from './features/system/systemSlice'
import {saveStoredContacts} from '../services/contactStorage'
import {saveStoredSettings} from '../services/settingsStorage'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        contacts: contactsReducer,
        messages: messagesReducer,
        settings: settingsReducer,
        system: systemReducer,
    },
})

document.documentElement.dataset.theme = store.getState().settings.theme

let previousSettings = ''
let previousContacts = ''

store.subscribe(() => {
    const state = store.getState()
    const settingsJson = JSON.stringify(state.settings)

    if (settingsJson !== previousSettings) {
        previousSettings = settingsJson
        saveStoredSettings(state.settings)
        document.documentElement.dataset.theme = state.settings.theme
    }

    if (state.auth.user?.id) {
        const contactsJson = JSON.stringify(state.contacts.items)
        if (contactsJson !== previousContacts) {
            previousContacts = contactsJson
            saveStoredContacts(state.auth.user.id, state.contacts.items)
        }
    }
})
