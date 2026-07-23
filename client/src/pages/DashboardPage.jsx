import {useEffect, useMemo, useRef, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {useNavigate, useSearchParams} from 'react-router-dom'
import AddContactModal from '../components/contacts/AddContactModal'
import MessageBubble from '../components/chat/MessageBubble'
import Icon from '../components/common/Icon'
import {Alert, Avatar, Button, EmptyState} from '../components/common/UI'
import {loadConversation, markConversationRead, sendEncryptedMessage,} from '../state/features/messages/messagesSlice'
import AppLayout from '../layouts/AppLayout'
import {formatMessageTime} from '../utils/formatters'

export default function DashboardPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const currentUserId = useSelector((state) => state.auth.user?.id)
    const contacts = useSelector((state) => state.contacts.items)
    const messagesState = useSelector((state) => state.messages)
    const socketStatus = useSelector((state) => state.system.socketStatus)
    const enterToSend = useSelector((state) => state.settings.enterToSend)
    const [query, setQuery] = useState('')
    const [draft, setDraft] = useState('')
    const [showAddContact, setShowAddContact] = useState(false)
    const listRef = useRef(null)
    const selectedId = searchParams.get('contact')
    const selectedContact = contacts.find(
        (contact) => contact.userId === selectedId,
    )
    const selectedContactId = selectedContact?.userId
    const messages = selectedId
        ? messagesState.byContact[selectedId] || []
        : []
    const loading = selectedId
        ? messagesState.loadingByContact[selectedId]
        : false
    const sending = selectedId
        ? messagesState.sendingByContact[selectedId]
        : false
    const error = selectedId
        ? messagesState.errorByContact[selectedId]
        : null

    const filteredContacts = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return contacts

        return contacts.filter((contact) =>
            `${contact.name} ${contact.userId}`.toLowerCase().includes(normalizedQuery),
        )
    }, [contacts, query])

    useEffect(() => {
        if (!selectedId && contacts.length > 0) {
            setSearchParams({contact: contacts[0].userId}, {replace: true})
        }
    }, [contacts, selectedId, setSearchParams])

    useEffect(() => {
        if (!selectedContactId) return
        dispatch(loadConversation({contactId: selectedContactId}))
        dispatch(markConversationRead(selectedContactId))
    }, [dispatch, selectedContactId])

    useEffect(() => {
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: 'smooth',
        })
    }, [messages.length, selectedId])

    const selectContact = (contactId) => {
        setSearchParams({contact: contactId})
        dispatch(markConversationRead(contactId))
    }

    const submitDraft = async () => {
        const text = draft.trim()
        if (!text || !selectedContact || sending) return

        const result = await dispatch(
            sendEncryptedMessage({contactId: selectedContact.userId, text}),
        )

        if (sendEncryptedMessage.fulfilled.match(result)) setDraft('')
    }

    const submit = (event) => {
        event.preventDefault()
        submitDraft()
    }

    const handleComposerKeyDown = (event) => {
        if (event.key !== 'Enter' || event.shiftKey || !enterToSend) return
        event.preventDefault()
        submitDraft()
    }

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
                            aria-label="Add a contact"
                            onClick={() => setShowAddContact(true)}
                        >
                            <Icon name="plus" size={20}/>
                        </button>
                    </div>
                    <label className="chat-search">
                        <Icon name="search" size={18}/>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search saved contacts"
                        />
                    </label>
                    <div className="conversation-label">
                        <span>SAVED CONTACTS</span>
                        <button onClick={() => navigate('/contacts')}>Manage</button>
                    </div>
                    <div className="conversation-list">
                        {filteredContacts.map((contact) => {
                            const contactMessages =
                                messagesState.byContact[contact.userId] || []
                            const latestMessage = contactMessages.at(-1)
                            const unread = messagesState.unreadByContact[contact.userId] || 0

                            return (
                                <button
                                    key={contact.userId}
                                    className={`conversation-item ${selectedId === contact.userId ? 'selected' : ''}`}
                                    onClick={() => selectContact(contact.userId)}
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
                            : ''}
                      </time>
                    </span>
                    <small>
                      {latestMessage?.text || 'No messages yet'}
                    </small>
                  </span>
                                    {unread > 0 && <b className="unread-count">{unread}</b>}
                                </button>
                            )
                        })}
                        {filteredContacts.length === 0 && (
                            <div className="conversation-empty">
                                {contacts.length === 0
                                    ? 'Add a contact using their backend user ID.'
                                    : 'No saved contact matches this search.'}
                            </div>
                        )}
                    </div>
                </section>

                <section className="message-panel">
                    {!selectedContact ? (
                        <EmptyState
                            icon="users"
                            title="No conversation selected"
                            description="The backend does not provide user discovery. Add a contact using the exact user ID, then start a chat."
                            action={
                                <Button icon="plus" onClick={() => setShowAddContact(true)}>
                                    Add contact
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
                          ? 'Online now'
                          : socketStatus === 'connected'
                              ? 'Offline'
                              : 'Presence unavailable'}
                    </small>
                  </span>
                                </div>
                                <div className="message-actions">
                                    <button
                                        aria-label="View contact fingerprint"
                                        onClick={() => navigate('/contacts')}
                                    >
                                        <Icon name="shield" size={19}/>
                                    </button>
                                </div>
                            </header>
                            <div className="encryption-banner">
                                <Icon name="lock" size={15}/>
                                <span>
                  Text is encrypted in this browser before it is sent to the backend.
                </span>
                            </div>
                            {error && <Alert>{error}</Alert>}
                            <div className="message-list" ref={listRef}>
                                {loading && messages.length === 0 ? (
                                    <div className="message-loading">Decrypting conversation…</div>
                                ) : messages.length === 0 ? (
                                    <EmptyState
                                        title={`Start a conversation with ${selectedContact.name}`}
                                        description="The first message will be encrypted using the contact’s uploaded ECDH public key."
                                    />
                                ) : (
                                    <>
                                        <div className="message-date">Encrypted history</div>
                                        {messages.map((message) => (
                                            <MessageBubble
                                                key={message.id}
                                                message={message}
                                                contact={selectedContact}
                                                outgoing={message.senderId === currentUserId}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                            <form className="message-composer" onSubmit={submit}>
                                <button
                                    type="button"
                                    aria-label="File messages are not supported by the backend"
                                    title="The backend message schema currently supports encrypted text only."
                                    disabled
                                >
                                    <Icon name="paperclip" size={20}/>
                                </button>
                                <textarea
                                    rows="1"
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    onKeyDown={handleComposerKeyDown}
                                    placeholder={`Message ${selectedContact.name.split(' ')[0]}…`}
                                    maxLength={4000}
                                />
                                <button
                                    className="send-button"
                                    type="submit"
                                    aria-label="Send message"
                                    disabled={!draft.trim() || sending}
                                >
                                    {sending ? <span className="button-spinner"/> : <Icon name="send" size={19}/>}
                                </button>
                            </form>
                        </>
                    )}
                </section>
            </div>

            {showAddContact && (
                <AddContactModal
                    onClose={() => setShowAddContact(false)}
                    onAdded={(contact) =>
                        setSearchParams({contact: contact.userId}, {replace: true})
                    }
                />
            )}
        </AppLayout>
    )
}
