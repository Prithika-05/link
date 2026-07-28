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

  const [contactToDelete, setContactToDelete] = useState(null);

  const confirmDeleteContact = async () => {
    if (!contactToDelete) return;

    const result = await dispatch(removeContact(contactToDelete.publicId));

    if (removeContact.fulfilled.match(result)) {
      setActionMessage(`Removed ${contactToDelete.name} from your contacts.`);
      setTimeout(() => setActionMessage(""), 4000);
    } else {
      alert(result.payload || "Failed to remove contact.");
    }

    setContactToDelete(null);
  };

  const contacts = useSelector((state) => state.contacts.items || []);
  const pendingRequests = useSelector(
    (state) => state.contacts.pendingRequests || [],
  );
  const sentRequests = useSelector(
    (state) => state.contacts.sentRequests || [],
  );

  const [activeTab, setActiveTab] = useState("contacts"); // 'contacts' | 'incoming' | 'sent'
  const [query, setQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [fingerprintContact, setFingerprintContact] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    dispatch(fetchPendingRequests());
  }, [dispatch]);

  // Filter contacts by query
  const filteredContacts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return contacts;

    return contacts.filter((contact) =>
      `${contact.name} ${contact.publicId} ${contact.username || ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [contacts, query]);

  // Filter incoming requests by query
  const filteredIncoming = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pendingRequests;

    return pendingRequests.filter((req) =>
      `${req.sender?.displayName || ""} ${req.sender?.username || ""} ${req.sender?.email || ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [pendingRequests, query]);

  // Filter sent requests by query
  const filteredSent = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sentRequests;

    return sentRequests.filter((req) =>
      `${req.receiver?.displayName || ""} ${req.receiver?.username || ""} ${req.receiver?.email || ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [sentRequests, query]);

  const startChat = (contact) => {
    navigate(`/dashboard?contact=${encodeURIComponent(contact.publicId)}`);
  };

  const handleSelectUserFromModal = async (targetUser) => {
    setShowSearchModal(false);
    const result = await dispatch(sendContactRequest(targetUser));
    if (sendContactRequest.fulfilled.match(result)) {
      setActionMessage(
        `Contact request sent to @${targetUser.username || "user"}!`,
      );
      setTimeout(() => setActionMessage(""), 4000);
    } else {
      alert(result.payload || "Failed to send request.");
    }
  };

  const handleResponse = (requestId, action, sender) => {
    dispatch(respondToContactRequest({ requestId, action, sender }));
  };

  const deleteContact = (contact) => {
    if (!window.confirm(`Remove ${contact.name} from your contacts?`)) return;
    dispatch(removeContact(contact.publicId));
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-indigo-500 uppercase">
              Your Network
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground mt-0.5">
              Contacts
            </h1>
          </div>

          <Button
            variant="primary"
            className="self-start sm:self-auto shadow-sm"
            onClick={() => setShowSearchModal(true)}
          >
            Add New Contact
          </Button>
        </header>

        {/* Global Feedback Alert */}
        {actionMessage && (
          <Alert
            variant="success"
            className="animate-in fade-in slide-in-from-top-2"
          >
            {actionMessage}
          </Alert>
        )}

        {/* Navigation Tabs Bar */}
        <div className="border-b border-border">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {/* Tab 1: Verified Contacts */}
            <button
              onClick={() => setActiveTab("contacts")}
              className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                activeTab === "contacts"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span>Verified Contacts</span>
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono ${
                  activeTab === "contacts"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {contacts.length}
              </span>
            </button>

            {/* Tab 2: Incoming Requests */}
            <button
              onClick={() => setActiveTab("incoming")}
              className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                activeTab === "incoming"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {pendingRequests.length > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
                Incoming Requests
              </span>
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono ${
                  activeTab === "incoming"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {pendingRequests.length}
              </span>
            </button>

            {/* Tab 3: Sent Requests */}
            <button
              onClick={() => setActiveTab("sent")}
              className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                activeTab === "sent"
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              <span>Sent Requests</span>
              <span
                className={`ml-1 px-2 py-0.5 text-xs rounded-full font-mono ${
                  activeTab === "sent"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {sentRequests.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Active Tab Main Card Container */}
        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Search Bar for the active list */}
          <div className="p-3.5 bg-muted/20 border-b border-border">
            <div className="relative flex items-center">
              <Icon
                name="search"
                size={16}
                className="absolute left-3.5 text-muted-foreground pointer-events-none"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeTab === "contacts"
                    ? "Filter contacts by name, username, or Public ID..."
                    : activeTab === "incoming"
                      ? "Filter incoming requests..."
                      : "Filter sent requests..."
                }
                className="w-full pl-10 pr-4 py-2 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* TAB CONTENT VIEWPORT */}
          <div className="divide-y divide-border/60">
            {/* VIEW 1: VERIFIED CONTACTS TAB */}
            {activeTab === "contacts" && (
              <>
                {filteredContacts.map((contact) => (
                  <article
                    key={contact.publicId}
                    className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar
                        initials={contact.initials}
                        color={contact.color}
                        online={contact.online}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {contact.name}
                        </h3>
                        <p
                          className="text-xs text-muted-foreground truncate font-mono mt-0.5"
                          title={contact.publicId}
                        >
                          Public ID: {truncateId(contact.publicId, 16)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => setFingerprintContact(contact)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-border/60"
                      >
                        <Icon
                          name="shield"
                          size={14}
                          className="text-indigo-500"
                        />
                        Fingerprint
                      </button>

                      <button
                        onClick={() => startChat(contact)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        Message
                        <Icon name="arrowRight" size={14} />
                      </button>

                      <button
                        onClick={() => setContactToDelete(contact)}
                        className="p-1.5 text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        aria-label={`Remove ${contact.name}`}
                      >
                        <Icon name="x" size={16} />
                      </button>
                    </div>
                  </article>
                ))}

                {filteredContacts.length === 0 && (
                  <div className="py-12 px-4">
                    <EmptyState
                      icon="users"
                      title={
                        contacts.length === 0
                          ? "No saved contacts"
                          : "No matches found"
                      }
                      description={
                        contacts.length === 0
                          ? "You haven't added any contacts yet."
                          : `No contacts match "${query}".`
                      }
                      action={
                        contacts.length === 0 ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowSearchModal(true)}
                          >
                            Add Contact
                          </Button>
                        ) : null
                      }
                    />
                  </div>
                )}
              </>
            )}

            {/* VIEW 2: INCOMING REQUESTS TAB */}
            {activeTab === "incoming" && (
              <>
                {filteredIncoming.map((req) => (
                  <article
                    key={req.id}
                    className="p-4 bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        initials={
                          req.sender?.username?.slice(0, 2).toUpperCase() || "U"
                        }
                        color="amber"
                        size="md"
                      />
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">
                          {req.sender?.displayName ||
                            `@${req.sender?.username}`}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {req.sender?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5"
                        onClick={() =>
                          handleResponse(req.id, "ACCEPTED", req.sender)
                        }
                      >
                        Accept
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs px-3 py-1.5"
                        onClick={() =>
                          handleResponse(req.id, "REJECTED", req.sender)
                        }
                      >
                        Decline
                      </Button>
                    </div>
                  </article>
                ))}

                {filteredIncoming.length === 0 && (
                  <div className="py-12 px-4">
                    <EmptyState
                      icon="users"
                      title="No incoming requests"
                      description={
                        pendingRequests.length === 0
                          ? "You don't have any pending contact requests."
                          : `No requests match "${query}".`
                      }
                    />
                  </div>
                )}
              </>
            )}

            {/* VIEW 3: SENT REQUESTS TAB */}
            {activeTab === "sent" && (
              <>
                {filteredSent.map((req) => {
                  const targetName =
                    req.receiver?.displayName ||
                    (req.receiver?.username
                      ? `@${req.receiver.username}`
                      : "User");

                  return (
                    <article
                      key={req.id}
                      className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <Avatar
                          initials={targetName.slice(0, 2).toUpperCase()}
                          color="blue"
                          size="md"
                        />
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">
                            {targetName}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {req.receiver?.email || "Request Sent"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-mono font-medium ${
                            req.status === "PENDING"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : req.status === "ACCEPTED"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {req.status === "PENDING"
                            ? "Awaiting Response"
                            : req.status}
                        </span>
                      </div>
                    </article>
                  );
                })}

                {filteredSent.length === 0 && (
                  <div className="py-12 px-4">
                    <EmptyState
                      icon="users"
                      title="No sent requests"
                      description={
                        sentRequests.length === 0
                          ? "You haven't sent any contact requests yet."
                          : `No requests match "${query}".`
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Modals */}
      {showSearchModal && (
        <UserSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSelectUser={handleSelectUserFromModal}
        />
      )}

      {fingerprintContact && (
        <Modal
          title={`${fingerprintContact.name}'s Key Fingerprint`}
          onClose={() => setFingerprintContact(null)}
        >
          <div className="space-y-4 p-1">
            <div className="p-3 rounded-lg bg-muted border border-border font-mono text-xs break-all tracking-wider text-center select-all">
              {formatFingerprint(fingerprintContact.fingerprint)}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verify this fingerprint out-of-band to ensure secure end-to-end
              encryption.
            </p>
          </div>
        </Modal>
      )}

      {contactToDelete && (
        <Modal title="Remove Contact?" onClose={() => setContactToDelete(null)}>
          <div className="space-y-4 p-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Icon name="shield" size={24} />
              <p className="text-xs font-semibold leading-relaxed">
                WARNING: This action cannot be restored automatically!
              </p>
            </div>

            <p className="text-sm text-foreground">
              Are you sure you want to remove{" "}
              <strong>{contactToDelete.name}</strong> from your verified
              contacts?
            </p>

            <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
              <li>
                You will no longer be able to send encrypted messages to this
                contact.
              </li>
              <li>The contact relationship in the server will be deleted.</li>
              <li>
                If you want to chat with <strong>{contactToDelete.name}</strong>{" "}
                in the future, you will have to send a new contact request[cite:
                17, 21].
              </li>
            </ul>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setContactToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={confirmDeleteContact}
              >
                Yes, Remove Contact
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
