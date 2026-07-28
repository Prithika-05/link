// src/pages/ContactsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Icon from "../components/common/Icon";
import {
  Avatar,
  Button,
  EmptyState,
  Modal,
  Alert,
} from "../components/common/UI";
import { UserSearchModal } from "../components/contacts/UserSearchModal";
import {
  fetchPendingRequests,
  respondToContactRequest,
  sendContactRequest,
  removeContact,
} from "../state/features/contacts/contactsSlice";
import AppLayout from "../layouts/AppLayout";
import { formatFingerprint } from "../services/cryptoService";
import { truncateId } from "../utils/formatters";

export default function ContactsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const contacts = useSelector((state) => state.contacts.items);
  const pendingRequests = useSelector(
    (state) => state.contacts.pendingRequests || [],
  );

  const [query, setQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [fingerprintContact, setFingerprintContact] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    dispatch(fetchPendingRequests());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return contacts;

    return contacts.filter((contact) =>
      `${contact.name} ${contact.publicId} ${contact.username || ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [contacts, query]);

  const startChat = (contact) => {
    navigate(`/dashboard?contact=${encodeURIComponent(contact.publicId)}`);
  };

  const handleSelectUserFromModal = async (targetUser) => {
    setShowSearchModal(false);
    const result = await dispatch(sendContactRequest(targetUser.publicId));
    if (sendContactRequest.fulfilled.match(result)) {
      setActionMessage(`Contact request sent to @${targetUser.username}!`);
      setTimeout(() => setActionMessage(""), 4000);
    } else {
      alert(result.payload || "Failed to send request.");
    }
  };

  const handleResponse = (requestId, action, sender) => {
    dispatch(respondToContactRequest({ requestId, action, sender }));
  };

  const deleteContact = (contact) => {
    if (!window.confirm(`Remove ${contact.name} from this browser?`)) return;
    dispatch(removeContact(contact.publicId));
  };

  return (
    <AppLayout>
      <div className="content-page">
        <header className="content-page-header">
          <div>
            <span className="eyebrow">YOUR NETWORK</span>
            <h1>Contacts</h1>
            <p>
              Send contact requests to connect with verified users before
              messaging.
            </p>
          </div>

          <Button icon="plus" onClick={() => setShowSearchModal(true)}>
            Add new contact
          </Button>
        </header>

        {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

        {/* ========================================================= */}
        {/* PENDING CONTACT REQUESTS SECTION                         */}
        {/* ========================================================= */}
        {pendingRequests.length > 0 && (
          <section className="contacts-card mb-6 border-amber-500/30">
            <div className="list-heading text-amber-600 dark:text-amber-400 font-semibold p-4">
              <span>PENDING CONTACT REQUESTS ({pendingRequests.length})</span>
            </div>

            <div className="p-2 space-y-2">
              {pendingRequests.map((req) => (
                <article
                  className="contact-row flex items-center justify-between p-3 rounded-lg bg-amber-500/10"
                  key={req.id}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      initials={
                        req.sender?.username?.slice(0, 2).toUpperCase() || "U"
                      }
                      color="amber"
                    />
                    <div>
                      <strong>
                        {req.sender?.displayName || `@${req.sender?.username}`}
                      </strong>
                      <br />
                      <small className="text-muted">{req.sender?.email}</small>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        handleResponse(req.id, "ACCEPTED", req.sender)
                      }
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        handleResponse(req.id, "REJECTED", req.sender)
                      }
                    >
                      Decline
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* ACCEPTED CONTACTS LIST                                     */}
        {/* ========================================================= */}
        <section className="contacts-card">
          <label className="large-search">
            <Icon name="search" size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search saved contacts, usernames, or Public IDs"
            />
          </label>

          <div className="contacts-results">
            <div className="list-heading">
              <span>VERIFIED PUBLIC-KEY CONTACTS</span>
              <span>{filtered.length} results</span>
            </div>

            {filtered.map((contact) => (
              <article className="contact-row" key={contact.publicId}>
                <Avatar
                  initials={contact.initials}
                  color={contact.color}
                  online={contact.online}
                />

                <div>
                  <strong>{contact.name}</strong>
                  <small title={contact.publicId}>
                    Public ID: {truncateId(contact.publicId, 18)} ·{" "}
                    {contact.algorithm}
                  </small>
                </div>

                <button
                  className="fingerprint-button"
                  onClick={() => setFingerprintContact(contact)}
                >
                  <Icon name="shield" size={17} /> Fingerprint
                </button>

                <button
                  className="start-chat"
                  onClick={() => startChat(contact)}
                >
                  Message <Icon name="arrowRight" size={16} />
                </button>

                <button
                  className="contact-remove"
                  onClick={() => deleteContact(contact)}
                  aria-label={`Remove ${contact.name}`}
                >
                  <Icon name="x" size={16} />
                </button>
              </article>
            ))}

            {filtered.length === 0 && (
              <EmptyState
                icon="users"
                title={
                  contacts.length === 0 ? "No contacts saved" : "No matches"
                }
                description={
                  contacts.length === 0
                    ? "Find someone using their username or email and send a contact request."
                    : "Try a different name or username."
                }
                action={
                  contacts.length === 0 ? (
                    <Button onClick={() => setShowSearchModal(true)}>
                      Add first contact
                    </Button>
                  ) : null
                }
              />
            )}
          </div>
        </section>
      </div>

      {showSearchModal && (
        <UserSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSelectUser={handleSelectUserFromModal}
        />
      )}

      {fingerprintContact && (
        <Modal
          title={`${fingerprintContact.name} fingerprint`}
          onClose={() => setFingerprintContact(null)}
        >
          <div className="fingerprint-modal-content">
            <code>{formatFingerprint(fingerprintContact.fingerprint)}</code>
            <p>
              Compare this fingerprint through a trusted channel before sending
              sensitive information.
            </p>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
