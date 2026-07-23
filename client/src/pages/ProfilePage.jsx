import {useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import Icon from '../components/common/Icon'
import {Alert, Avatar, Button, Modal} from '../components/common/UI'
import {refreshCurrentUser} from '../state/features/auth/authSlice'
import AppLayout from '../layouts/AppLayout'
import {formatFingerprint, getStoredKeyPair,} from '../services/cryptoService'
import {keyService} from '../services/keyService'
import {getInitials} from '../utils/contact'

export default function ProfilePage() {
    const dispatch = useDispatch()
    const user = useSelector((state) => state.auth.user)
    const [publicKey, setPublicKey] = useState(null)
    const [localKey, setLocalKey] = useState(null)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [showKey, setShowKey] = useState(false)

    useEffect(() => {
        let active = true

        Promise.all([
            keyService.getPublicKey(user.id),
            getStoredKeyPair(user.id),
        ])
            .then(([backendKey, deviceKey]) => {
                if (!active) return
                setPublicKey(backendKey)
                setLocalKey(deviceKey)
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || 'Unable to load key details.')
            })

        return () => {
            active = false
        }
    }, [user.id])

    const fingerprint = publicKey?.fingerprint || localKey?.fingerprint
    const keyMatches = Boolean(
        publicKey?.fingerprint &&
        localKey?.fingerprint &&
        publicKey.fingerprint === localKey.fingerprint,
    )

    const copyFingerprint = async () => {
        if (!fingerprint) return
        await navigator.clipboard.writeText(fingerprint)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
    }

    const downloadPublicKey = () => {
        if (!publicKey?.key) return
        const blob = new Blob([publicKey.key], {type: 'application/json'})
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `linkchat-${user.id}-public-key.json`
        anchor.click()
        URL.revokeObjectURL(url)
    }

    return (
        <AppLayout>
            <div className="content-page narrow-page">
                <header className="content-page-header">
                    <div>
                        <span className="eyebrow">YOUR ACCOUNT</span>
                        <h1>Profile</h1>
                        <p>Identity data is loaded from GET /api/users/me.</p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => dispatch(refreshCurrentUser())}
                    >
                        Refresh profile
                    </Button>
                </header>
                {error && <Alert>{error}</Alert>}
                <section className="profile-card">
                    <div className="profile-hero">
                        <Avatar
                            initials={getInitials(user.username)}
                            color="violet"
                            size="xl"
                            online
                        />
                        <div>
                            <h2>{user.username}</h2>
                            <p>{user.email}</p>
                            <small><Icon name="check" size={14}/> Authenticated backend account</small>
                        </div>
                    </div>
                    <div className="profile-details">
                        <div>
                            <span>Backend user ID</span>
                            <strong className="long-value">{user.id}</strong>
                        </div>
                        <div>
                            <span>Public key status</span>
                            <strong className={keyMatches ? 'success-text' : 'warning-text'}>
                                <Icon name={keyMatches ? 'check' : 'shield'} size={15}/>
                                {keyMatches
                                    ? 'Backend and device keys match'
                                    : 'Key mismatch or key unavailable'}
                            </strong>
                        </div>
                    </div>
                </section>
                <section className="security-card">
                    <div className="card-heading">
                        <div>
                            <span className="eyebrow">SECURITY</span>
                            <h2>Your identity fingerprint</h2>
                            <p>Share or compare this value to verify your public key.</p>
                        </div>
                        <Icon name="shield" size={27}/>
                    </div>
                    <div className="fingerprint-display">
                        <code>{formatFingerprint(fingerprint)}</code>
                        <button onClick={copyFingerprint} disabled={!fingerprint}>
                            {copied ? (
                                <><Icon name="check" size={17}/> Copied</>
                            ) : (
                                <><Icon name="copy" size={17}/> Copy</>
                            )}
                        </button>
                    </div>
                    <div className="security-actions">
                        <button onClick={downloadPublicKey} disabled={!publicKey?.key}>
                            <Icon name="download" size={18}/> Export public key
                        </button>
                        <button onClick={() => setShowKey(true)} disabled={!publicKey?.key}>
                            <Icon name="eye" size={18}/> View public key
                        </button>
                    </div>
                </section>
            </div>

            {showKey && (
                <Modal title="Uploaded public key" onClose={() => setShowKey(false)}>
                    <pre className="public-key-preview">{publicKey?.key}</pre>
                </Modal>
            )}
        </AppLayout>
    )
}
