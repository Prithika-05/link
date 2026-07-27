import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "../../../api/apiError.js";
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

export const loadContacts = createAsyncThunk(
  "contacts/loadContacts",
  async (ownerId) => loadStoredContacts(ownerId),
);

/**
 * Start or select a conversation with a discovered target user.
 * Fetches public key on the fly and saves contact locally.
 */
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

export const addContact = createAsyncThunk(
  "contacts/addContact",
  async ({ publicId, name }, { getState, rejectWithValue }) => {
    const normalizedId = publicId.trim();
    const displayName = name.trim() || fallbackContactName(normalizedId);
    const currentUserId = getState().auth.user?.publicId;

    if (!normalizedId) {
      return rejectWithValue("A public ID is required.");
    }

    if (normalizedId === currentUserId) {
      return rejectWithValue("You cannot add yourself as a contact.");
    }

    try {
      const publicKey = await keyService.getPublicKey(normalizedId);

      const contact = {
        publicId: normalizedId,
        name: displayName,
        initials: getInitials(displayName),
        color: colorFromId(normalizedId),
        fingerprint: publicKey.fingerprint,
        algorithm: publicKey.algorithm,
        publicKey: publicKey.key,
        online: false,
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
          "No public key was found for that user. The user must finish key setup first.",
        ),
      );
    }
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

/**
 * Remove contact thunk to update both Redux & LocalStorage.
 */
export const removeContact = createAsyncThunk(
  "contacts/removeContact",
  async (publicId, { getState }) => {
    const currentUserId = getState().auth.user?.publicId;
    const existing = getState().contacts.items;
    const updated = existing.filter((item) => item.publicId !== publicId);

    saveStoredContacts(currentUserId, updated);
    return publicId;
  },
);

const initialState = {
  items: [],
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

    clearContactsError(state) {
      state.error = null;
    },

    resetContacts(state) {
      state.items = [];
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
      .addCase(loadContacts.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload || null;
        state.loaded = true;
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
      .addCase(addContact.fulfilled, (state, action) => {
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
      .addCase(ensureIncomingContact.fulfilled, (state, action) => {
        const exists = state.items.some(
          (contact) => contact.publicId === action.payload.publicId,
        );

        if (!exists) {
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

export const { setContactPresence, clearContactsError, resetContacts } =
  contactsSlice.actions;

export default contactsSlice.reducer;
