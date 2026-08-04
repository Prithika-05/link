import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "../../../api/apiError.js";
import { apiClient } from "../../../api/httpClient.js";
import { keyService } from "../../../services/keyService.js";
import { userService } from "../../../services/userService.js";
import {
  loadStoredContacts,
  saveStoredContacts,
} from "../../../services/contactStorage.js";
import {
  colorFromId,
  fallbackContactName,
  getInitials,
} from "../../../utils/contact.js";
import { clearConversation } from "../messages/messagesSlice.js";

export const loadContacts = createAsyncThunk(
  "contacts/loadContacts",
  async (ownerId) => loadStoredContacts(ownerId),
);

export const fetchPendingRequests = createAsyncThunk(
  "contacts/fetchPendingRequests",
  async (_, { getState, rejectWithValue }) => {
    try {
      const [{ data: requestsRes }, { data: acceptedRes }] = await Promise.all([
        apiClient.get("/contacts/requests/pending"),
        apiClient.get("/contacts/accepted"),
      ]);

      const incoming = requestsRes.data.incoming || [];
      const outgoing = requestsRes.data.outgoing || [];
      const validAcceptedPublicIds = new Set(acceptedRes.data || []);

      const currentUserId = getState().auth.user?.publicId;
      const existingContacts = getState().contacts.items || [];

      let contactsChanged = false;

      let updatedContacts = existingContacts.map((contact) => {
        const isStillAccepted = validAcceptedPublicIds.has(contact.publicId);
        if (contact.isAccepted !== isStillAccepted) {
          contactsChanged = true;
          return { ...contact, isAccepted: isStillAccepted };
        }
        return contact;
      });

      const acceptedOutgoing = outgoing.filter(
        (req) => req.status === "ACCEPTED",
      );

      for (const req of acceptedOutgoing) {
        const receiver = req.receiver;
        if (!receiver?.publicId) continue;

        const existingIndex = updatedContacts.findIndex(
          (item) => item.publicId === receiver.publicId,
        );

        if (
          existingIndex === -1 &&
          validAcceptedPublicIds.has(receiver.publicId)
        ) {
          const publicKeyObj = await keyService
            .getPublicKey(receiver.publicId)
            .catch(() => null);

          const displayName =
            receiver.displayName ||
            receiver.username ||
            fallbackContactName(receiver.publicId);

          const newContact = {
            publicId: receiver.publicId,
            username: receiver.username,
            email: receiver.email || "",
            name: displayName,
            initials: getInitials(displayName),
            color: colorFromId(receiver.publicId),
            fingerprint: publicKeyObj?.fingerprint || publicKeyObj?.key || "",
            algorithm: publicKeyObj?.algorithm || "ECDH-P256",
            publicKey: publicKeyObj?.key || null,
            online: false,
            isAccepted: true,
            addedAt: new Date().toISOString(),
          };

          updatedContacts.unshift(newContact);
          contactsChanged = true;
        }
      }

      if (contactsChanged && currentUserId) {
        saveStoredContacts(currentUserId, updatedContacts);
      }

      const pendingOutgoing = outgoing.filter(
        (req) => req.status === "PENDING",
      );

      return {
        incoming,
        outgoing: pendingOutgoing,
        verifiedContacts: updatedContacts,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to sync contact list."),
      );
    }
  },
);

export const sendContactRequest = createAsyncThunk(
  "contacts/sendContactRequest",
  async (targetUser, { rejectWithValue }) => {
    try {
      const targetPublicId = targetUser.publicId || targetUser;
      const { data } = await apiClient.post("/contacts/requests", {
        receiverPublicId: targetPublicId,
      });

      return {
        request: data.data,
        receiver: targetUser,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to send contact request."),
      );
    }
  },
);

export const respondToContactRequest = createAsyncThunk(
  "contacts/respondToContactRequest",
  async ({ requestId, action, sender }, { getState, rejectWithValue }) => {
    try {
      await apiClient.post("/contacts/requests/respond", {
        requestId,
        action,
      });

      if (action === "ACCEPTED" && sender) {
        const publicKeyObj = await keyService
          .getPublicKey(sender.publicId)
          .catch(() => null);

        const displayName =
          sender.displayName ||
          sender.username ||
          fallbackContactName(sender.publicId);

        const newContact = {
          publicId: sender.publicId,
          username: sender.username,
          email: sender.email || "",
          name: displayName,
          initials: getInitials(displayName),
          color: colorFromId(sender.publicId),
          fingerprint: publicKeyObj?.fingerprint || publicKeyObj?.key || "",
          algorithm: publicKeyObj?.algorithm || "ECDH-P256",
          publicKey: publicKeyObj?.key || null,
          online: false,
          addedAt: new Date().toISOString(),
        };

        const currentUserId = getState().auth.user?.publicId;
        const existing = getState().contacts.items;
        const updated = [
          newContact,
          ...existing.filter((item) => item.publicId !== sender.publicId),
        ];

        saveStoredContacts(currentUserId, updated);

        return { requestId, action, contact: newContact };
      }

      return { requestId, action, contact: null };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to respond to request."),
      );
    }
  },
);

/**
 * Handle real-time event when someone accepts your contact request
 */
export const handleRealtimeContactAccepted = createAsyncThunk(
  "contacts/handleRealtimeContactAccepted",
  async ({ requestId, contact }, { getState }) => {
    const publicKeyObj = await keyService
      .getPublicKey(contact.publicId)
      .catch(() => null);

    const displayName =
      contact.displayName ||
      contact.username ||
      fallbackContactName(contact.publicId);

    const newContact = {
      publicId: contact.publicId,
      username: contact.username,
      email: contact.email || "",
      name: displayName,
      initials: getInitials(displayName),
      color: colorFromId(contact.publicId),
      fingerprint: publicKeyObj?.fingerprint || publicKeyObj?.key || "",
      algorithm: publicKeyObj?.algorithm || "ECDH-P256",
      publicKey: publicKeyObj?.key || null,
      online: true,
      addedAt: new Date().toISOString(),
    };

    const currentUserId = getState().auth.user?.publicId;
    const existing = getState().contacts.items || [];
    const updated = [
      newContact,
      ...existing.filter((item) => item.publicId !== contact.publicId),
    ];

    saveStoredContacts(currentUserId, updated);

    return { requestId, contact: newContact };
  },
);

export const ensureIncomingContact = createAsyncThunk(
  "contacts/ensureIncomingContact",
  async (publicId, { getState }) => {
    const currentUserId = getState().auth.user?.publicId;
    const existing = getState().contacts.items.find(
      (contact) => contact.publicId === publicId,
    );

    if (existing) return existing;

    let displayName = fallbackContactName(publicId);
    let publicKeyObj = null;

    try {
      const [userProfile, fetchedKey] = await Promise.all([
        userService.getUserByPublicId(publicId).catch(() => null),
        keyService.getPublicKey(publicId).catch(() => null),
      ]);

      if (userProfile?.displayName || userProfile?.username) {
        displayName = userProfile.displayName || `@${userProfile.username}`;
      }

      publicKeyObj = fetchedKey;
    } catch {
      // Fallback
    }

    const newContact = {
      publicId,
      name: displayName,
      initials: getInitials(displayName),
      color: colorFromId(publicId),
      fingerprint: publicKeyObj?.fingerprint ?? null,
      algorithm: publicKeyObj?.algorithm ?? "ECDH-P256",
      publicKey: publicKeyObj?.key ?? null,
      online: true,
      addedAt: new Date().toISOString(),
    };

    const updated = [newContact, ...getState().contacts.items];
    saveStoredContacts(currentUserId, updated);

    return newContact;
  },
);

export const startConversation = createAsyncThunk(
  "contacts/startConversation",
  async (targetUser, { getState, rejectWithValue }) => {
    const publicId = targetUser.publicId;
    const displayName =
      targetUser.displayName ||
      targetUser.username ||
      fallbackContactName(publicId);
    const currentUserId = getState().auth.user?.publicId;

    if (!publicId) {
      return rejectWithValue("Invalid user selection.");
    }

    if (publicId === currentUserId) {
      return rejectWithValue("You cannot start a chat with yourself.");
    }

    try {
      let publicKeyObj = targetUser.publicKey
        ? { key: targetUser.publicKey }
        : null;
      if (!publicKeyObj) {
        publicKeyObj = await keyService.getPublicKey(publicId);
      }

      const contact = {
        publicId,
        username: targetUser.username,
        email: targetUser.email,
        name: displayName,
        initials: getInitials(displayName),
        color: colorFromId(publicId),
        fingerprint: publicKeyObj?.fingerprint || publicKeyObj?.key || "",
        algorithm: publicKeyObj?.algorithm || "ECDH-P256",
        publicKey: publicKeyObj?.key || targetUser.publicKey,
        online: targetUser.status === "ONLINE",
        addedAt: new Date().toISOString(),
      };

      const existing = getState().contacts.items;
      const updated = [
        contact,
        ...existing.filter((item) => item.publicId !== contact.publicId),
      ];

      saveStoredContacts(currentUserId, updated);

      return contact;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "No public key found for this user. The user must finish key setup first.",
        ),
      );
    }
  },
);

export const removeContact = createAsyncThunk(
  "contacts/removeContact",
  async (publicId, { dispatch, getState, rejectWithValue }) => {
    try {
      await apiClient.delete(`/contacts/${encodeURIComponent(publicId)}`);

      dispatch(clearConversation(publicId));

      const currentUserId = getState().auth.user?.publicId;
      const existing = getState().contacts.items || [];
      const updated = existing.filter((item) => item.publicId !== publicId);

      saveStoredContacts(currentUserId, updated);

      return publicId;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to remove contact."),
      );
    }
  },
);

const initialState = {
  items: [],
  pendingRequests: [],
  sentRequests: [],
  status: "idle",
  error: null,
  loaded: false,
};

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    setContactPresence(state, action) {
      const targetId = action.payload.publicId || action.payload.userId;
      const contact = state.items.find((item) => item.publicId === targetId);

      if (contact) {
        contact.online = action.payload.online;
      }
    },

    // Real-time socket reducer: New incoming contact request received
    incomingRequestReceived(state, action) {
      const { requestId, sender } = action.payload;
      const exists = state.pendingRequests.some((r) => r.id === requestId);
      if (!exists) {
        state.pendingRequests.unshift({
          id: requestId,
          sender,
          createdAt: new Date().toISOString(),
        });
      }
    },

    // Real-time socket reducer: Sent request rejected by receiver
    outgoingRequestRejected(state, action) {
      const { requestId } = action.payload;
      state.sentRequests = state.sentRequests.filter((r) => r.id !== requestId);
    },

    clearContactsError(state) {
      state.error = null;
    },

    resetContacts(state) {
      state.items = [];
      state.pendingRequests = [];
      state.sentRequests = [];
      state.status = "idle";
      state.error = null;
      state.loaded = false;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadContacts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadContacts.fulfilled, (state, action) => {
        state.status = "ready";
        state.items = action.payload;
        state.loaded = true;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.pendingRequests = action.payload.incoming || [];
        state.sentRequests = action.payload.outgoing || [];
        if (action.payload.verifiedContacts) {
          state.items = action.payload.verifiedContacts;
        }
      })
      .addCase(sendContactRequest.fulfilled, (state, action) => {
        const { request, receiver } = action.payload;
        state.sentRequests.unshift({
          ...request,
          receiver:
            typeof receiver === "object" ? receiver : { publicId: receiver },
        });
      })
      .addCase(respondToContactRequest.fulfilled, (state, action) => {
        const { requestId, action: reqAction, contact } = action.payload;
        state.pendingRequests = state.pendingRequests.filter(
          (r) => r.id !== requestId,
        );
        if (reqAction === "ACCEPTED" && contact) {
          const index = state.items.findIndex(
            (item) => item.publicId === contact.publicId,
          );
          if (index >= 0) {
            state.items[index] = contact;
          } else {
            state.items.unshift(contact);
          }
        }
      })
      .addCase(handleRealtimeContactAccepted.fulfilled, (state, action) => {
        const { requestId, contact } = action.payload;
        state.sentRequests = state.sentRequests.filter(
          (r) => r.id !== requestId,
        );
        const index = state.items.findIndex(
          (item) => item.publicId === contact.publicId,
        );
        if (index >= 0) {
          state.items[index] = contact;
        } else {
          state.items.unshift(contact);
        }
      })
      .addCase(ensureIncomingContact.fulfilled, (state, action) => {
        const exists = state.items.some(
          (contact) => contact.publicId === action.payload.publicId,
        );

        if (!exists) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        state.status = "ready";
        const index = state.items.findIndex(
          (contact) => contact.publicId === action.payload.publicId,
        );

        if (index >= 0) {
          state.items[index] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(removeContact.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (contact) => contact.publicId !== action.payload,
        );
      });
  },
});

export const {
  setContactPresence,
  incomingRequestReceived,
  outgoingRequestRejected,
  clearContactsError,
  resetContacts,
} = contactsSlice.actions;

export default contactsSlice.reducer;
