import {useMemo, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {useNavigate} from 'react-router-dom'
import AddContactModal from '../components/contacts/AddContactModal'
import Icon from '../components/common/Icon'
import {Avatar, Button, EmptyState, Modal} from '../components/common/UI'
import {removeContact} from '../state/features/contacts/contactsSlice'
import AppLayout from '../layouts/AppLayout'
import {formatFingerprint} from '../services/cryptoService'
import {truncateId} from '../utils/formatters'

export default function ContactsPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const contacts = useSelector((state) => state.contacts.items)
    const [query, setQuery] = useState('')
    const [showAdd, setShowAdd] = useState(false)
    const [fingerprintContact, setFingerprintContact] = useState(null)

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase()
        if (!normalized) return contacts
        return contacts.filter((contact) =>
            `${contact.name} ${contact.userId}`.toLowerCase().includes(normalized),
        )
    }, [contacts, query])

    const startChat = (contact) => {
        navigate(`/dashboard?contact=${encodeURIComponent(contact.userId)}`)
    }

    const deleteContact = (contact) => {
        if (!window.confirm(`Remove ${contact.name} from this browser?`)) return
        dispatch(removeContact(contact.userId))
    }

    return (
        <AppLayout>
            <div className="content-page">
                <header className="content-page-header">
                    <div>
                        <span className="eyebrow">YOUR NETWORK</span>
                        <h1>Contacts</h1>
                        <p>Contacts are saved locally because the backend has no user-list API.</p>
                    </div>
                    <Button icon="plus" onClick={() => setShowAdd(true)}>
                        New contact
                    </Button>
                </header>
                <section className="contacts-card">
                    <label className="large-search">
                        <Icon name="search" size={20}/>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search saved contacts or user IDs"
                        />
                    </label>
                    <div className="contacts-results">
                        <div className="list-heading">
                            <span>VERIFIED PUBLIC-KEY CONTACTS</span>
                            <span>{filtered.length} results</span>
                        </div>
                        {filtered.map((contact) => (
                            <article className="contact-row" key={contact.userId}>
                                <Avatar
                                    initials={contact.initials}
                                    color={contact.color}
                                    online={contact.online}
                                />
                                <div>
                                    <strong>{contact.name}</strong>
                                    <small title={contact.userId}>
                                        ID: {truncateId(contact.userId, 18)} · {contact.algorithm}
                                    </small>
                                </div>
                                <button
                                    className="fingerprint-button"
                                    onClick={() => setFingerprintContact(contact)}
                                >
                                    <Icon name="shield" size={17}/> Fingerprint
                                </button>
                                <button className="start-chat" onClick={() => startChat(contact)}>
                                    Message <Icon name="arrowRight" size={16}/>
                                </button>
                                <button
                                    className="contact-remove"
                                    onClick={() => deleteContact(contact)}
                                    aria-label={`Remove ${contact.name}`}
                                >
                                    <Icon name="x" size={16}/>
                                </button>
                            </article>
                        ))}
                        {filtered.length === 0 && (
                            <EmptyState
                                icon="users"
                                title={contacts.length === 0 ? 'No contacts saved' : 'No matches'}
                                description={
                                    contacts.length === 0
                                        ? 'Add someone using the exact user ID returned by their backend account.'
                                        : 'Try a different name or user ID.'
                                }
                                action={
                                    contacts.length === 0 ? (
                                        <Button onClick={() => setShowAdd(true)}>Add first contact</Button>
                                    ) : null
                                }
                            />
                        )}
                    </div>
                </section>
            </div>

            {showAdd && <AddContactModal onClose={() => setShowAdd(false)}/>}
            {fingerprintContact && (
                <Modal
                    title={`${fingerprintContact.name} fingerprint`}
                    onClose={() => setFingerprintContact(null)}
                >
                    <div className="fingerprint-modal-content">
                        <code>{formatFingerprint(fingerprintContact.fingerprint)}</code>
                        <p>
                            Compare this fingerprint through a trusted channel before sending sensitive information.
                        </p>
                    </div>
                </Modal>
            )}
        </AppLayout>
    )
}
