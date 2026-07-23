import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {getApiErrorMessage} from '../../../api/apiError.js'
import {decryptMessage, encryptMessage} from '../../../services/cryptoService.js'
import {keyService} from '../../../services/keyService.js'
import {messageService} from '../../../services/messageService.js'
import {socketService} from '../../../services/socketService.js'

async function decryptConversationMessage(message, currentUserId, contactPublicKey) {
    const isOutgoing = message.senderId === currentUserId
    const counterpartyPublicKey = isOutgoing
        ? contactPublicKey
        : message.ephemeralPublicKey

    try {
        const text = await decryptMessage({
            currentUserId,
            counterpartyPublicKey,
            message,
        })

        return {...message, text, decryptionFailed: false}
    } catch {
        return {
            ...message,
            text: 'Unable to decrypt this message with the current device key.',
            decryptionFailed: true,
        }
    }
}

export const loadConversation = createAsyncThunk(
    'messages/loadConversation',
    async ({contactId, page = 1, limit = 50}, {getState, rejectWithValue}) => {
        const currentUserId = getState().auth.user?.id

        try {
            const [conversation, publicKey] = await Promise.all([
                messageService.getConversation(contactId, {page, limit}),
                keyService.getPublicKey(contactId),
            ])

            const messages = await Promise.all(
                conversation.messages.map((message) =>
                    decryptConversationMessage(message, currentUserId, publicKey.key),
                ),
            )

            return {
                contactId,
                messages,
                pagination: conversation.pagination,
            }
        } catch (error) {
            return rejectWithValue({
                contactId,
                message: getApiErrorMessage(
                    error,
                    'Unable to load the conversation.',
                ),
            })
        }
    },
)

export const sendEncryptedMessage = createAsyncThunk(
    'messages/sendEncryptedMessage',
    async ({contactId, text}, {getState, rejectWithValue}) => {
        const currentUserId = getState().auth.user?.id

        try {
            const publicKey = await keyService.getPublicKey(contactId)
            const encryptedPayload = await encryptMessage({
                senderId: currentUserId,
                receiverId: contactId,
                receiverPublicKey: publicKey.key,
                plaintext: text,
            })
            const apiPayload = {
                receiverId: contactId,
                ...encryptedPayload,
            }

            let response
            let transport = 'socket'

            try {
                response = await socketService.sendMessage(apiPayload)
            } catch {
                response = await messageService.sendMessage(apiPayload)
                transport = 'rest'
            }

            return {
                contactId,
                transport,
                message: {
                    id: response.messageId,
                    senderId: currentUserId,
                    receiverId: contactId,
                    ...encryptedPayload,
                    text,
                    status: 'SENT',
                    type: 'TEXT',
                    createdAt: new Date().toISOString(),
                    decryptionFailed: false,
                },
            }
        } catch (error) {
            return rejectWithValue({
                contactId,
                message: getApiErrorMessage(error, 'Unable to send the message.'),
            })
        }
    },
)

export const decryptRealtimeMessage = createAsyncThunk(
    'messages/decryptRealtimeMessage',
    async (message, {getState, rejectWithValue}) => {
        const currentUserId = getState().auth.user?.id

        try {
            const text = await decryptMessage({
                currentUserId,
                counterpartyPublicKey: message.ephemeralPublicKey,
                message,
            })

            return {
                contactId: message.senderId,
                message: {
                    ...message,
                    text,
                    status: message.status || 'SENT',
                    type: message.type || 'TEXT',
                    decryptionFailed: false,
                },
            }
        } catch {
            return rejectWithValue({
                contactId: message.senderId,
                message: {
                    ...message,
                    text: 'Unable to decrypt this incoming message.',
                    decryptionFailed: true,
                },
            })
        }
    },
)

function insertUniqueMessage(state, contactId, message) {
    const existing = state.byContact[contactId] || []
    if (existing.some((item) => item.id === message.id)) return
    state.byContact[contactId] = [...existing, message].sort(
        (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
    )
}

const messagesSlice = createSlice({
    name: 'messages',
    initialState: {
        byContact: {},
        paginationByContact: {},
        loadingByContact: {},
        errorByContact: {},
        sendingByContact: {},
        unreadByContact: {},
    },
    reducers: {
        markConversationRead(state, action) {
            state.unreadByContact[action.payload] = 0
        },
        clearConversation(state, action) {
            delete state.byContact[action.payload]
            delete state.paginationByContact[action.payload]
            delete state.errorByContact[action.payload]
        },
        resetMessages(state) {
            state.byContact = {}
            state.paginationByContact = {}
            state.loadingByContact = {}
            state.errorByContact = {}
            state.sendingByContact = {}
            state.unreadByContact = {}
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadConversation.pending, (state, action) => {
                state.loadingByContact[action.meta.arg.contactId] = true
                state.errorByContact[action.meta.arg.contactId] = null
            })
            .addCase(loadConversation.fulfilled, (state, action) => {
                const {contactId, messages, pagination} = action.payload
                state.loadingByContact[contactId] = false
                state.byContact[contactId] = messages
                state.paginationByContact[contactId] = pagination
            })
            .addCase(loadConversation.rejected, (state, action) => {
                const contactId = action.payload?.contactId || action.meta.arg.contactId
                state.loadingByContact[contactId] = false
                state.errorByContact[contactId] = action.payload?.message
            })
            .addCase(sendEncryptedMessage.pending, (state, action) => {
                state.sendingByContact[action.meta.arg.contactId] = true
                state.errorByContact[action.meta.arg.contactId] = null
            })
            .addCase(sendEncryptedMessage.fulfilled, (state, action) => {
                state.sendingByContact[action.payload.contactId] = false
                insertUniqueMessage(
                    state,
                    action.payload.contactId,
                    action.payload.message,
                )
            })
            .addCase(sendEncryptedMessage.rejected, (state, action) => {
                const contactId = action.payload?.contactId || action.meta.arg.contactId
                state.sendingByContact[contactId] = false
                state.errorByContact[contactId] = action.payload?.message
            })
            .addCase(decryptRealtimeMessage.fulfilled, (state, action) => {
                const {contactId, message} = action.payload
                insertUniqueMessage(state, contactId, message)
                state.unreadByContact[contactId] =
                    (state.unreadByContact[contactId] || 0) + 1
            })
            .addCase(decryptRealtimeMessage.rejected, (state, action) => {
                if (!action.payload) return
                insertUniqueMessage(
                    state,
                    action.payload.contactId,
                    action.payload.message,
                )
                state.unreadByContact[action.payload.contactId] =
                    (state.unreadByContact[action.payload.contactId] || 0) + 1
            })
    },
})

export const {markConversationRead, clearConversation, resetMessages} =
    messagesSlice.actions
export default messagesSlice.reducer
