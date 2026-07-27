import React, { useState, useEffect } from "react";
import { userService } from "../../services/userService";
import { keyService } from "../../services/keyService";

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
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleUserClick = async (user) => {
    try {
      setLoading(true);

      // Fetch target user's active public key on the fly
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Start a New Chat
        </h3>

        <input
          type="text"
          className="w-full rounded-md border border-gray-300 p-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Search by username or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {loading && <p className="mt-2 text-sm text-gray-500">Searching...</p>}
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <ul className="mt-4 max-h-60 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
          {results.map((user) => (
            <li
              key={user.publicId}
              onClick={() => handleUserClick(user)}
              className="cursor-pointer p-3 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {user.displayName}{" "}
                <span className="text-sm font-normal text-gray-500">
                  (@{user.username})
                </span>
              </div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
