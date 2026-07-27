import React, { useState, useEffect } from "react";
import { userService } from "../../services/userService";
import { keyService } from "../../services/keyService";
import Icon from "../common/Icon";
import { Avatar, Alert, Modal } from "../common/UI";
import { getInitials, colorFromId } from "../../utils/contact";

export function UserSearchModal({ isOpen, onClose, onSelectUser }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await userService.searchUsers(query.trim());
        setResults(data.users || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to search users.");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleUserClick = async (user) => {
    try {
      setLoading(true);

      let recipientPublicKey = null;
      try {
        const keyData = await keyService.getPublicKey(user.publicId);
        recipientPublicKey = keyData?.key ?? null;
      } catch (keyErr) {
        console.warn("Recipient public key not found:", keyErr);
      }

      onSelectUser({
        ...user,
        publicKey: recipientPublicKey,
      });

      onClose();
    } catch (err) {
      setError("Could not start chat with selected user.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal title="Start a New Chat" onClose={onClose}>
      <div className="user-search-modal-content">
        <label className="chat-search mb-4">
          <Icon name="search" size={18} />
          <input
            type="text"
            placeholder="Search by @username or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </label>

        {error && <Alert>{error}</Alert>}

        <div className="conversation-list max-h-64 overflow-y-auto">
          {loading && (
            <div className="message-loading text-center py-4">
              Searching users…
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="contacts-results">
              {results.map((user) => {
                const displayName = user.displayName || user.username;
                const initials = getInitials(displayName);
                const color = colorFromId(user.publicId);

                return (
                  <button
                    key={user.publicId}
                    className="conversation-item w-full flex items-center gap-3 p-3 text-left hover:bg-surface-hover rounded-lg transition-colors"
                    onClick={() => handleUserClick(user)}
                  >
                    <Avatar
                      initials={initials}
                      color={color}
                      online={user.status === "ONLINE"}
                    />
                    <span className="conversation-copy flex-1 min-w-0">
                      <span className="flex items-center justify-between">
                        <strong className="truncate">{displayName}</strong>
                        <small className="text-muted">@{user.username}</small>
                      </span>
                      <small className="truncate text-muted block">
                        {user.email}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="conversation-empty py-6 text-center text-muted">
              No registered user found matching "{query}"
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="conversation-empty py-6 text-center text-muted">
              Type a username or email to find people on LinkChat.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
