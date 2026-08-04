import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "../../../api/apiError.js";
import {
  decryptMessage,
  encryptMessage,
} from "../../../services/cryptoService.js";
import { keyService } from "../../../services/keyService.js";
import { messageService } from "../../../services/messageService.js";
import { socketService } from "../../../services/socketService.js";
import {
  saveLocalMessage,
  getLocalMessagesForContact,
} from "../../../services/messageStorage.js";

async function decryptConversationMessage(message, currentUserPublicId) {
  const isOutgoing = message.senderPublicId === currentUserPublicId;
  const targetPublicId = isOutgoing
    ? message.receiverPublicId
    : message.senderPublicId;

  let counterpartyPublicKey = message.ephemeralPublicKey;

  if (isOutgoing) {
    try {
      const recipientKeyObj = await keyService.getPublicKey(targetPublicId);
      counterpartyPublicKey = recipientKeyObj.key;
    } catch {
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
      // 1. Fetch locally stored messages (includes outgoing plaintext & decrypted incoming)
      const localMessages = await getLocalMessagesForContact(
        currentUserPublicId,
        contactId,
      );

      // 2. Fetch server conversation history
      const conversation = await messageService.getConversation(contactId, {
        page,
        limit,
      });

      const serverMessages = conversation.messages || [];
      const mergedList = [];

      // 3. Process server records against local store
      for (const msg of serverMessages) {
        const isOutgoing = msg.senderPublicId === currentUserPublicId;
        const localMatch = localMessages.find((m) => m.id === msg.id);

        if (localMatch) {
          mergedList.push(localMatch);
          continue;
        }

        if (isOutgoing) {
          // Outgoing message missing locally (e.g. sent from a different browser)
          mergedList.push({
            ...msg,
            text: "[Sent from another device - Ephemeral Key Discarded]",
            decryptionFailed: true,
          });
          continue;
        }

        // Decrypt incoming message & save to IndexedDB
        try {
          const decrypted = await decryptConversationMessage(
            msg,
            currentUserPublicId,
          );
          await saveLocalMessage(currentUserPublicId, contactId, decrypted);
          mergedList.push(decrypted);
        } catch {
          mergedList.push({
            ...msg,
            text: "Unable to decrypt this message.",
            decryptionFailed: true,
          });
        }
      }

      return {
        contactId,
        messages: mergedList,
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

      if (transport === "rest") {
        const restPayload = {
          messageId: crypto.randomUUID(),
          timestamp: Date.now(),
          nonce: generateNonce(),
          receiverPublicId: targetPublicId,
          ...encryptedPayload,
        };

        try {
          response = await messageService.sendMessage(restPayload);
        } catch (restError) {
          const errorMsg = getApiErrorMessage(restError, "");
          if (errorMsg.includes("Duplicate message detected")) {
            console.info("Message was already processed via socket.");
          } else {
            throw restError;
          }
        }
      }

      const finalMessage = {
        id:
          response?.id ||
          response?.data?.id ||
          response?.data?.messageId ||
          initialMessageId,
        senderPublicId: currentUserPublicId,
        receiverPublicId: targetPublicId,
        ...encryptedPayload,
        text,
        status: "SENT",
        type: "TEXT",
        createdAt: new Date().toISOString(),
        decryptionFailed: false,
      };

      // Save plaintext copy to local IndexedDB
      await saveLocalMessage(currentUserPublicId, targetPublicId, finalMessage);

      return {
        contactId: targetPublicId,
        transport,
        message: finalMessage,
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

      const decryptedMsg = {
        ...message,
        text,
        status: message.status || "SENT",
        type: message.type || "TEXT",
        decryptionFailed: false,
      };

      // Save real-time incoming message to local IndexedDB
      await saveLocalMessage(
        currentUserPublicId,
        message.senderPublicId,
        decryptedMsg,
      );

      return {
        contactId: message.senderPublicId,
        message: decryptedMsg,
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
