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
    async ({publicId, name}, {getState, rejectWithValue}) => {
    const normalizedId = publicId.trim()
    const displayName = name.trim() || fallbackContactName(normalizedId)
    const currentUserId = getState().auth.user?.publicId

    if (!normalizedId) {
        return rejectWithValue('A public ID is required.')
    }

    if (normalizedId === currentUserId) {
        return rejectWithValue('You cannot add yourself as a contact.')
    }

    try {
        const publicKey = await keyService.getPublicKey(normalizedId)

        return {
            publicId: normalizedId,
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
                'No public key was found for that user. The user must finish key setup first.',
            ),
        )
    }
    },
)

export const ensureIncomingContact = createAsyncThunk(
    'contacts/ensureIncomingContact',
    async (publicId, { getState }) => {
        const existing = getState().contacts.items.find(
            (contact) => contact.publicId === publicId,
        )

        if (existing) return existing

        const name = fallbackContactName(publicId)

        return {
            publicId,
            name,
            initials: getInitials(name),
            color: colorFromId(publicId),
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
                (contact) => contact.publicId !== action.payload,
            )
        },

        setContactPresence(state, action) {
            const contact = state.items.find(
                (item) => item.publicId === action.payload.publicId,
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
                    (contact) => contact.publicId === action.payload.publicId,
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
                    (contact) => contact.publicId === action.payload.publicId,
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