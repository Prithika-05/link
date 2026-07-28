import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UserSearchModal } from "../components/contacts/UserSearchModal";
import MessageBubble from "../components/chat/MessageBubble";
import Icon from "../components/common/Icon";
import { Alert, Avatar, Button, EmptyState } from "../components/common/UI";
import {
  loadConversation,
  markConversationRead,
  sendEncryptedMessage,
} from "../state/features/messages/messagesSlice";
import {
  fetchPendingRequests,
  sendContactRequest,
} from "../state/features/contacts/contactsSlice";
import AppLayout from "../layouts/AppLayout";
import { formatMessageTime } from "../utils/formatters";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentUserPublicId = useSelector((state) => state.auth.user?.publicId);
  const contacts = useSelector((state) => state.contacts.items || []);
  const messagesState = useSelector((state) => state.messages);
  const socketStatus = useSelector((state) => state.system.socketStatus);
  const enterToSend = useSelector((state) => state.settings.enterToSend);

  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const listRef = useRef(null);

  const selectedId = searchParams.get("contact");
  const selectedContact = contacts.find(
    (contact) => contact.publicId === selectedId,
  );
  const selectedContactId = selectedContact?.publicId;

  const messages = selectedId ? messagesState.byContact[selectedId] || [] : [];
  const loading = selectedId
    ? messagesState.loadingByContact[selectedId]
    : false;
  const sending = selectedId
    ? messagesState.sendingByContact[selectedId]
    : false;
  const error = selectedId ? messagesState.errorByContact[selectedId] : null;

  // FIX 1: Fetch pending/accepted requests when Dashboard mounts to stay in sync
  useEffect(() => {
    dispatch(fetchPendingRequests());
  }, [dispatch]);

  const filteredContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return contacts;

    return contacts.filter((contact) =>
      `${contact.name} ${contact.username || ""} ${contact.email || ""}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [contacts, query]);

  // FIX 2: Auto-select first contact if none is selected or if selected contact was removed
  useEffect(() => {
    if (contacts.length > 0) {
      if (!selectedId || !selectedContact) {
        setSearchParams({ contact: contacts[0].publicId }, { replace: true });
      }
    }
  }, [contacts, selectedId, selectedContact, setSearchParams]);

  useEffect(() => {
    if (!selectedContactId) return;
    dispatch(loadConversation({ contactId: selectedContactId }));
    dispatch(markConversationRead(selectedContactId));
  }, [dispatch, selectedContactId]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, selectedId]);

  const selectContact = (contactId) => {
    setSearchParams({ contact: contactId });
    dispatch(markConversationRead(contactId));
  };

  // FIX 3: Instead of directly starting a conversation, send a Contact Request!
  const handleSelectDiscoveredUser = async (targetUser) => {
    setShowUserSearch(false);
    const result = await dispatch(sendContactRequest(targetUser));

    if (sendContactRequest.fulfilled.match(result)) {
      setActionMessage(
        `Contact request sent to @${targetUser.username || "user"}!`,
      );
      setTimeout(() => setActionMessage(""), 4000);
    } else {
      alert(result.payload || "Failed to send contact request.");
    }
  };

  const submitDraft = async () => {
    const text = draft.trim();
    if (!text || !selectedContact || sending) return;

    const result = await dispatch(
      sendEncryptedMessage({ contactId: selectedContact.publicId, text }),
    );

    if (sendEncryptedMessage.fulfilled.match(result)) setDraft("");
  };

  const submit = (event) => {
    event.preventDefault();
    submitDraft();
  };

  const handleComposerKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || !enterToSend) return;
    event.preventDefault();
    submitDraft();
  };
  const isVerifiedContact = useMemo(() => {
    if (!selectedContact) return false;
    return selectedContact.isAccepted !== false;
  }, [selectedContact]);
  return (
    <AppLayout>
      <div className="chat-layout">
        <section className="conversation-panel">
          <div className="conversation-top">
            <div>
              <p className="page-kicker">YOUR MESSAGES</p>
              <h1>Chats</h1>
            </div>
            <button
              className="round-icon"
              aria-label="Find users"
              onClick={() => setShowUserSearch(true)}
            >
              <Icon name="plus" size={20} />
            </button>
          </div>

          <label className="chat-search">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search chats"
            />
          </label>

          <div className="conversation-label">
            <span>CONVERSATIONS</span>
            <button onClick={() => navigate("/contacts")}>Manage</button>
          </div>

          <div className="conversation-list">
            {filteredContacts.map((contact) => {
              const contactMessages =
                messagesState.byContact[contact.publicId] || [];
              const latestMessage = contactMessages.at(-1);
              const unread =
                messagesState.unreadByContact[contact.publicId] || 0;

              return (
                <button
                  key={contact.publicId}
                  className={`conversation-item ${
                    selectedId === contact.publicId ? "selected" : ""
                  }`}
                  onClick={() => selectContact(contact.publicId)}
                >
                  <Avatar
                    initials={contact.initials}
                    color={contact.color}
                    online={contact.online}
                  />
                  <span className="conversation-copy">
                    <span>
                      <strong>{contact.name}</strong>
                      <time>
                        {latestMessage
                          ? formatMessageTime(latestMessage.createdAt)
                          : ""}
                      </time>
                    </span>
                    <small>{latestMessage?.text || "No messages yet"}</small>
                  </span>
                  {unread > 0 && <b className="unread-count">{unread}</b>}
                </button>
              );
            })}

            {filteredContacts.length === 0 && (
              <div className="conversation-empty">
                {contacts.length === 0
                  ? "Send a contact request to someone to start chatting."
                  : "No conversation matches this search."}
              </div>
            )}
          </div>
        </section>
        <section className="message-panel">
          {actionMessage && <Alert variant="success">{actionMessage}</Alert>}

          {!selectedContact ? (
            <EmptyState
              icon="users"
              title="No contact selected"
              description="Send contact requests to connect with verified users before messaging."
              action={
                <Button icon="plus" onClick={() => setShowUserSearch(true)}>
                  Add New Contact
                </Button>
              }
            />
          ) : (
            <>
              <header className="message-header">
                <div className="contact-head">
                  <Avatar
                    initials={selectedContact.initials}
                    color={selectedContact.color}
                    online={selectedContact.online}
                  />
                  <span>
                    <h2>{selectedContact.name}</h2>
                    <small>
                      {selectedContact.online
                        ? "Online now"
                        : socketStatus === "connected"
                          ? "Offline"
                          : "Presence unavailable"}
                    </small>
                  </span>
                </div>

                <div className="message-actions">
                  <button
                    aria-label="View contacts page"
                    onClick={() => navigate("/contacts")}
                    title="Manage Contacts"
                  >
                    <Icon name="shield" size={19} />
                  </button>
                </div>
              </header>

              {/* Warning Banner if contact relationship is broken */}
              {!isVerifiedContact ? (
                <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
                  <span>
                    You cannot message this user. Send a contact request to
                    reconnect.
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelectDiscoveredUser(selectedContact)}
                  >
                    Send Request
                  </Button>
                </div>
              ) : (
                <div className="encryption-banner">
                  <Icon name="lock" size={15} />
                  <span>
                    Text is encrypted in this browser before it is sent to the
                    backend.
                  </span>
                </div>
              )}

              {error && <Alert>{error}</Alert>}

              <div className="message-list" ref={listRef}>
                {loading && messages.length === 0 ? (
                  <div className="message-loading">
                    Decrypting conversation…
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState
                    title={`No messages with ${selectedContact.name}`}
                    description="Your conversation history will appear here once you start chatting."
                  />
                ) : (
                  <>
                    <div className="message-date">Encrypted history</div>
                    {messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        contact={selectedContact}
                        outgoing={
                          message.senderPublicId === currentUserPublicId
                        }
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Message Composer - Disabled if not a verified contact */}
              <form className="message-composer" onSubmit={submit}>
                <button
                  type="button"
                  aria-label="File messages are not supported by the backend"
                  disabled
                >
                  <Icon name="paperclip" size={20} />
                </button>

                <textarea
                  rows="1"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder={
                    isVerifiedContact
                      ? `Message ${selectedContact.name.split(" ")[0]}…`
                      : "You cannot message this user..."
                  }
                  maxLength={4000}
                  disabled={!isVerifiedContact} // <-- Disabled when not verified!
                />

                <button
                  className="send-button"
                  type="submit"
                  aria-label="Send message"
                  disabled={!draft.trim() || sending || !isVerifiedContact}
                >
                  {sending ? (
                    <span className="button-spinner" />
                  ) : (
                    <Icon name="send" size={19} />
                  )}
                </button>
              </form>
            </>
          )}
        </section>{" "}
      </div>

      {showUserSearch && (
        <UserSearchModal
          isOpen={showUserSearch}
          onClose={() => setShowUserSearch(false)}
          onSelectUser={handleSelectDiscoveredUser}
        />
      )}
    </AppLayout>
  );
}
