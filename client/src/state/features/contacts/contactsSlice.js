import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {getApiErrorMessage} from '../../../api/apiError.js'
import {keyService} from '../../../services/keyService.js'
import {loadStoredContacts} from '../../../services/contactStorage.js'
import {
    colorFromId,
    fallbackContactName,
    getInitials,
} from '../../../utils/contact.js'

export const loadContacts = createAsyncThunk(
    'contacts/loadContacts',
    async (ownerId) => loadStoredContacts(ownerId),
)

export const addContact = createAsyncThunk(
    'contacts/addContact',
    async ({userId, name}, {getState, rejectWithValue}) => {
        const normalizedId = userId.trim()
        const displayName = name.trim() || fallbackContactName(normalizedId)
        const currentUserId = getState().auth.user?.id

        if (!normalizedId) {
            return rejectWithValue('A backend user ID is required.')
        }

        if (normalizedId === currentUserId) {
            return rejectWithValue('You cannot add yourself as a contact.')
        }

        try {
            const publicKey = await keyService.getPublicKey(normalizedId)

            return {
                id: normalizedId,
                userId: normalizedId,
                name: displayName,
                initials: getInitials(displayName),
                color: colorFromId(normalizedId),
                fingerprint: publicKey.fingerprint,
                algorithm: publicKey.algorithm,
                online: false,
                addedAt: new Date().toISOString(),
            }
        } catch (error) {
            return rejectWithValue(
                getApiErrorMessage(
                    error,
                    'No public key was found for that user ID. The user must finish key setup first.',
                ),
            )
        }
    },
)

export const ensureIncomingContact = createAsyncThunk(
    'contacts/ensureIncomingContact',
    async (userId, {getState}) => {
        const existing = getState().contacts.items.find(
            (contact) => contact.userId === userId,
        )

        if (existing) return existing

        const name = fallbackContactName(userId)

        return {
            id: userId,
            userId,
            name,
            initials: getInitials(name),
            color: colorFromId(userId),
            fingerprint: null,
            algorithm: 'ECDH-P256',
            online: true,
            addedAt: new Date().toISOString(),
        }
    },
)

const initialState = {
    items: [],
    status: 'idle',
    error: null,
    loaded: false,
}

const contactsSlice = createSlice({
    name: 'contacts',
    initialState,
    reducers: {
        removeContact(state, action) {
            state.items = state.items.filter(
                (contact) => contact.userId !== action.payload,
            )
        },

        setContactPresence(state, action) {
            const contact = state.items.find(
                (item) => item.userId === action.payload.userId,
            )

            if (contact) {
                contact.online = action.payload.online
            }
        },

        clearContactsError(state) {
            state.error = null
        },

        resetContacts(state) {
            state.items = []
            state.status = 'idle'
            state.error = null
            state.loaded = false
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(loadContacts.pending, (state) => {
                state.status = 'loading'
            })

            .addCase(loadContacts.fulfilled, (state, action) => {
                state.status = 'ready'
                state.items = action.payload
                state.loaded = true
            })

            .addCase(loadContacts.rejected, (state, action) => {
                state.status = 'error'
                state.error = action.payload || null
                state.loaded = true
            })

            .addCase(addContact.pending, (state) => {
                state.status = 'saving'
                state.error = null
            })

            .addCase(addContact.fulfilled, (state, action) => {
                state.status = 'ready'

                const index = state.items.findIndex(
                    (contact) => contact.userId === action.payload.userId,
                )

                if (index >= 0) {
                    state.items[index] = action.payload
                } else {
                    state.items.unshift(action.payload)
                }
            })

            .addCase(addContact.rejected, (state, action) => {
                state.status = 'error'
                state.error = action.payload
            })

            .addCase(ensureIncomingContact.fulfilled, (state, action) => {
                const exists = state.items.some(
                    (contact) => contact.userId === action.payload.userId,
                )

                if (!exists) {
                    state.items.unshift(action.payload)
                }
            })
    },
})

export const {
    removeContact,
    setContactPresence,
    clearContactsError,
    resetContacts,
} = contactsSlice.actions

export default contactsSlice.reducer