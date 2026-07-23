import {useEffect, useState} from 'react'
import {useSelector} from 'react-redux'
import {useNavigate} from 'react-router-dom'
import Icon from '../components/common/Icon'
import {Alert, Button} from '../components/common/UI'
import AuthLayout from '../layouts/AuthLayout'
import {createKeyPairMaterial, formatFingerprint, getStoredKeyPair, storeKeyPair,} from '../services/cryptoService'
import {keyService} from '../services/keyService'

export default function KeySetupPage() {
    const navigate = useNavigate()
    const user = useSelector((state) => state.auth.user)
    const [fingerprint, setFingerprint] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        getStoredKeyPair(user.id)
            .then((record) => setFingerprint(record?.fingerprint || ''))
            .catch(() => setFingerprint(''))
    }, [user.id])

    const createKeys = async () => {
        if (fingerprint) {
            const confirmed = window.confirm(
                'Replacing this device key will make messages encrypted with the old key unreadable. Continue?',
            )
            if (!confirmed) return
        }

        setBusy(true)
        setError('')

        try {
            const material = await createKeyPairMaterial(user.id)
            await keyService.uploadPublicKey({
                algorithm: material.algorithm,
                key: material.publicKey,
                fingerprint: material.fingerprint,
            })
            await storeKeyPair(material)
            setFingerprint(material.fingerprint)
        } catch (setupError) {
            setError(setupError.message || 'Key setup failed.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <AuthLayout aside={false}>
            <div className="setup-page">
                <div className="setup-progress">
                    <span className="done">1</span><i/>
                    <span className="current">2</span><i/>
                    <span className={fingerprint ? 'done' : ''}>3</span>
                </div>
                <div className="setup-icon">
                    <Icon name={fingerprint ? 'check' : 'key'} size={35}/>
                </div>
                <div className="auth-heading centered">
                    <span className="eyebrow">SECURITY SETUP</span>
                    <h1>{fingerprint ? 'Your device key is ready.' : 'Set up your security key.'}</h1>
                    <p>
                        {fingerprint
                            ? 'The public key is stored by the backend. The private key remains in this browser’s IndexedDB.'
                            : 'LinkChat needs an ECDH P-256 key pair before this device can encrypt and decrypt messages.'}
                    </p>
                </div>
                {error && <Alert>{error}</Alert>}
                {!fingerprint ? (
                    <div className="key-explainer">
                        <div>
                            <Icon name="key" size={20}/>
                            <span><strong>Private key</strong><small>Non-exportable and stored in IndexedDB.</small></span>
                        </div>
                        <div>
                            <Icon name="shield" size={20}/>
                            <span><strong>Public key</strong><small>Uploaded through POST /api/keys.</small></span>
                        </div>
                    </div>
                ) : (
                    <div className="key-ready">
                        <div className="fingerprint-box">
                            <span>Your public fingerprint</span>
                            <code>{formatFingerprint(fingerprint)}</code>
                            <small>Compare this value with contacts through a trusted channel.</small>
                        </div>
                        <p><Icon name="shield" size={17}/> The private key was not sent to the server.</p>
                    </div>
                )}
                <div className="setup-actions">
                    <Button
                        onClick={createKeys}
                        icon="key"
                        loading={busy}
                        variant={fingerprint ? 'secondary' : 'primary'}
                    >
                        {fingerprint ? 'Replace this device key' : 'Generate and upload key'}
                    </Button>
                    {fingerprint && (
                        <Button onClick={() => navigate('/dashboard')} iconRight="arrowRight">
                            Continue to LinkChat
                        </Button>
                    )}
                </div>
                <p className="setup-note">
                    <Icon name="lock" size={15}/> Clearing browser storage removes the private key and can make old
                    messages unreadable.
                </p>
            </div>
        </AuthLayout>
    )
}
