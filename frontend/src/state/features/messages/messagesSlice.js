import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "../../../api/apiError.js";
import {
  decryptMessage,
  encryptMessage,
} from "../../../services/cryptoService.js";
import { keyService } from "../../../services/keyService.js";
import { messageService } from "../../../services/messageService.js";
import { socketService } from "../../../services/socketService.js";

async function decryptConversationMessage(message, currentUserPublicId) {
  const isOutgoing = message.senderPublicId === currentUserPublicId;
  const targetPublicId = isOutgoing
    ? message.receiverPublicId
    : message.senderPublicId;

  let counterpartyPublicKey = message.ephemeralPublicKey;

  // If this is an outgoing message sent by the current user,
  // we must derive the secret using the RECIPIENT'S public key!
  if (isOutgoing) {
    try {
      const recipientKeyObj = await keyService.getPublicKey(targetPublicId);
      counterpartyPublicKey = recipientKeyObj.key;
    } catch {
      // Fallback to ephemeralPublicKey if fetch fails
      counterpartyPublicKey = message.ephemeralPublicKey;
    }
  }

  try {
    const text = await decryptMessage({
      currentUserPublicId,
      counterpartyPublicKey,
      message,
    });

    return { ...message, text, decryptionFailed: false };
  } catch (err) {
    console.error("Decryption failed for message:", message.id, err);
    return {
      ...message,
      text: "Unable to decrypt this message with the current device key.",
      decryptionFailed: true,
    };
  }
}

export const loadConversation = createAsyncThunk(
  "messages/loadConversation",
  async (
    { contactId, page = 1, limit = 50 },
    { getState, rejectWithValue },
  ) => {
    const currentUserPublicId = getState().auth.user?.publicId;

    try {
      const conversation = await messageService.getConversation(contactId, {
        page,
        limit,
      });

      const messages = await Promise.all(
        conversation.messages.map((message) =>
          decryptConversationMessage(message, currentUserPublicId),
        ),
      );

      return {
        contactId,
        messages,
        pagination: conversation.pagination,
      };
    } catch (error) {
      return rejectWithValue({
        contactId,
        message: getApiErrorMessage(error, "Unable to load the conversation."),
      });
    }
  },
);

export const sendEncryptedMessage = createAsyncThunk(
  "messages/sendEncryptedMessage",
  async ({ contactId, text }, { getState, rejectWithValue }) => {
    const currentUserPublicId = getState().auth.user?.publicId;
    const targetPublicId = contactId?.trim();

    if (!targetPublicId) {
      return rejectWithValue({
        contactId,
        message: "Invalid recipient ID.",
      });
    }

    try {
      // 1. Fetch recipient public key
      const publicKey = await keyService.getPublicKey(targetPublicId);

      // 2. Encrypt plaintext
      const encryptedPayload = await encryptMessage({
        senderPublicId: currentUserPublicId,
        receiverPublicId: targetPublicId,
        receiverPublicKey: publicKey.key,
        plaintext: text,
      });

      const generateNonce = () =>
        btoa(
          String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
        );

      const initialMessageId = crypto.randomUUID();
      const initialTimestamp = Date.now();
      const initialNonce = generateNonce();

      const socketPayload = {
        messageId: initialMessageId,
        timestamp: initialTimestamp,
        nonce: initialNonce,
        receiverId: targetPublicId,
        receiverPublicId: targetPublicId,
        ...encryptedPayload,
      };

      let response;
      let transport = "socket";

      // Check if socket is connected before trying
      if (socketService.isConnected()) {
        try {
          response = await socketService.sendMessage(socketPayload);
        } catch (socketError) {
          console.warn(
            "Socket send failed or timed out. Falling back to REST API.",
            socketError,
          );
          transport = "rest";
        }
      } else {
        transport = "rest";
      }

      // If socket failed or was disconnected, send via REST API with a BRAND NEW messageId and nonce
      if (transport === "rest") {
        const restPayload = {
          messageId: crypto.randomUUID(), // Brand new ID
          timestamp: Date.now(),
          nonce: generateNonce(), // Brand new Nonce
          receiverPublicId: targetPublicId,
          ...encryptedPayload,
        };

        try {
          response = await messageService.sendMessage(restPayload);
        } catch (restError) {
          // If REST API fails with duplicate, it means socket actually succeeded in the background!
          const errorMsg = getApiErrorMessage(restError, "");
          if (errorMsg.includes("Duplicate message detected")) {
            console.info("Message was already processed via socket.");
          } else {
            throw restError;
          }
        }
      }

      return {
        contactId: targetPublicId,
        transport,
        message: {
          id: response?.data?.messageId || initialMessageId,
          senderPublicId: currentUserPublicId,
          receiverPublicId: targetPublicId,
          ...encryptedPayload,
          text,
          status: "SENT",
          type: "TEXT",
          createdAt: new Date().toISOString(),
          decryptionFailed: false,
        },
      };
    } catch (error) {
      return rejectWithValue({
        contactId: targetPublicId,
        message: getApiErrorMessage(error, "Unable to send the message."),
      });
    }
  },
);

export const decryptRealtimeMessage = createAsyncThunk(
  "messages/decryptRealtimeMessage",
  async (message, { getState, rejectWithValue }) => {
    const currentUserPublicId = getState().auth.user?.publicId;

    try {
      const text = await decryptMessage({
        currentUserPublicId,
        counterpartyPublicKey: message.ephemeralPublicKey,
        message,
      });

      return {
        contactId: message.senderPublicId,
        message: {
          ...message,
          text,
          status: message.status || "SENT",
          type: message.type || "TEXT",
          decryptionFailed: false,
        },
      };
    } catch {
      return rejectWithValue({
        contactId: message.senderPublicId,
        message: {
          ...message,
          text: "Unable to decrypt this incoming message.",
          decryptionFailed: true,
        },
      });
    }
  },
);

function insertUniqueMessage(state, contactId, message) {
  const existing = state.byContact[contactId] || [];
  if (existing.some((item) => item.id === message.id)) return;
  state.byContact[contactId] = [...existing, message].sort(
    (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
  );
}

const messagesSlice = createSlice({
  name: "messages",
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
      state.unreadByContact[action.payload] = 0;
    },
    clearConversation(state, action) {
      delete state.byContact[action.payload];
      delete state.paginationByContact[action.payload];
      delete state.errorByContact[action.payload];
    },
    resetMessages(state) {
      state.byContact = {};
      state.paginationByContact = {};
      state.loadingByContact = {};
      state.errorByContact = {};
      state.sendingByContact = {};
      state.unreadByContact = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadConversation.pending, (state, action) => {
        state.loadingByContact[action.meta.arg.contactId] = true;
        state.errorByContact[action.meta.arg.contactId] = null;
      })
      .addCase(loadConversation.fulfilled, (state, action) => {
        const { contactId, messages, pagination } = action.payload;
        state.loadingByContact[contactId] = false;
        state.byContact[contactId] = messages;
        state.paginationByContact[contactId] = pagination;
      })
      .addCase(loadConversation.rejected, (state, action) => {
        const contactId =
          action.payload?.contactId || action.meta.arg.contactId;
        state.loadingByContact[contactId] = false;
        state.errorByContact[contactId] = action.payload?.message;
      })
      .addCase(sendEncryptedMessage.pending, (state, action) => {
        state.sendingByContact[action.meta.arg.contactId] = true;
        state.errorByContact[action.meta.arg.contactId] = null;
      })
      .addCase(sendEncryptedMessage.fulfilled, (state, action) => {
        state.sendingByContact[action.payload.contactId] = false;
        insertUniqueMessage(
          state,
          action.payload.contactId,
          action.payload.message,
        );
      })
      .addCase(sendEncryptedMessage.rejected, (state, action) => {
        const contactId =
          action.payload?.contactId || action.meta.arg.contactId;
        state.sendingByContact[contactId] = false;
        state.errorByContact[contactId] = action.payload?.message;
      })
      .addCase(decryptRealtimeMessage.fulfilled, (state, action) => {
        const { contactId, message } = action.payload;
        insertUniqueMessage(state, contactId, message);
        state.unreadByContact[contactId] =
          (state.unreadByContact[contactId] || 0) + 1;
      })
      .addCase(decryptRealtimeMessage.rejected, (state, action) => {
        if (!action.payload) return;
        insertUniqueMessage(
          state,
          action.payload.contactId,
          action.payload.message,
        );
        state.unreadByContact[action.payload.contactId] =
          (state.unreadByContact[action.payload.contactId] || 0) + 1;
      });
  },
});

export const { markConversationRead, clearConversation, resetMessages } =
  messagesSlice.actions;
export default messagesSlice.reducer;
