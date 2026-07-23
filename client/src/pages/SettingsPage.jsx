import {useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import Icon from '../components/common/Icon'
import {Alert, Toggle} from '../components/common/UI'
import {
    setDesktopNotifications,
    setEnterToSend,
    setSoundEnabled,
    setTheme,
} from '../state/features/settings/settingsSlice'
import AppLayout from '../layouts/AppLayout'
import {createKeyPairMaterial, formatFingerprint, getStoredKeyPair, storeKeyPair,} from '../services/cryptoService'
import {keyService} from '../services/keyService'

const tabs = ['General', 'Security', 'Devices', 'Notifications', 'Appearance']

export default function SettingsPage() {
    const dispatch = useDispatch()
    const user = useSelector((state) => state.auth.user)
    const settings = useSelector((state) => state.settings)
    const [activeTab, setActiveTab] = useState('General')
    const [keyRecord, setKeyRecord] = useState(null)
    const [busy, setBusy] = useState(false)
    const [notice, setNotice] = useState(null)

    useEffect(() => {
        getStoredKeyPair(user.id).then(setKeyRecord).catch(() => setKeyRecord(null))
    }, [user.id])

    const requestNotifications = async (enabled) => {
        if (!enabled) {
            dispatch(setDesktopNotifications(false))
            return
        }

        if (!window.Notification) {
            setNotice({type: 'error', message: 'This browser does not support desktop notifications.'})
            return
        }

        const permission = await window.Notification.requestPermission()
        dispatch(setDesktopNotifications(permission === 'granted'))
        if (permission !== 'granted') {
            setNotice({type: 'error', message: 'Notification permission was not granted.'})
        }
    }

    const rotateKeys = async () => {
        const confirmed = window.confirm(
            'Key rotation will make messages encrypted with the previous key unreadable. The current backend has no key-history or recovery endpoint. Continue?',
        )
        if (!confirmed) return

        setBusy(true)
        setNotice(null)

        try {
            const material = await createKeyPairMaterial(user.id)
            await keyService.uploadPublicKey({
                algorithm: material.algorithm,
                key: material.publicKey,
                fingerprint: material.fingerprint,
            })
            await storeKeyPair(material)
            setKeyRecord(material)
            setNotice({type: 'success', message: 'Encryption key rotated and uploaded successfully.'})
        } catch (error) {
            setNotice({type: 'error', message: error.message || 'Key rotation failed.'})
        } finally {
            setBusy(false)
        }
    }

    const downloadPublicKey = () => {
        if (!keyRecord?.publicKey) return
        const blob = new Blob([keyRecord.publicKey], {type: 'application/json'})
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `linkchat-${user.id}-public-key.json`
        anchor.click()
        URL.revokeObjectURL(url)
    }

    return (
        <AppLayout>
            <div className="content-page settings-page">
                <header className="content-page-header">
                    <div>
                        <span className="eyebrow">PREFERENCES</span>
                        <h1>Settings</h1>
                        <p>Local preferences and the key operations supported by the backend.</p>
                    </div>
                </header>
                {notice && (
                    <Alert type={notice.type} onDismiss={() => setNotice(null)}>
                        {notice.message}
                    </Alert>
                )}
                <div className="settings-layout">
                    <nav className="settings-tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                className={activeTab === tab ? 'active' : ''}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'Security' && <Icon name="shield" size={17}/>}
                                {tab === 'Devices' && <Icon name="device" size={17}/>}
                                {tab === 'Notifications' && <Icon name="bell" size={17}/>}
                                {tab === 'Appearance' && <Icon name="sparkles" size={17}/>}
                                {tab}
                            </button>
                        ))}
                    </nav>
                    <section className="settings-panel">
                        {activeTab === 'General' && (
                            <>
                                <div className="settings-panel-heading">
                                    <h2>General settings</h2>
                                    <p>These preferences are stored in this browser.</p>
                                </div>
                                <div className="settings-group">
                                    <Toggle
                                        label="Enter sends a message"
                                        description="Turn this off to use the send button and keep Enter for new lines."
                                        checked={settings.enterToSend}
                                        onChange={(event) =>
                                            dispatch(setEnterToSend(event.target.checked))
                                        }
                                    />
                                    <Toggle
                                        label="Message sounds"
                                        description="Reserved for incoming-message sounds in this browser."
                                        checked={settings.soundEnabled}
                                        onChange={(event) =>
                                            dispatch(setSoundEnabled(event.target.checked))
                                        }
                                    />
                                </div>
                                <div className="backend-limit-card">
                                    <Icon name="shield" size={19}/>
                                    <div>
                                        <strong>Read receipts are not enabled</strong>
                                        <small>The backend contains receipt code, but it is not registered by the active
                                            Socket.IO initializer.</small>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'Security' && (
                            <>
                                <div className="settings-panel-heading">
                                    <h2>Security</h2>
                                    <p>Manage the device key used for ECDH and AES-GCM message encryption.</p>
                                </div>
                                <div className="security-status">
                                    <span><Icon name="shield" size={22}/></span>
                                    <div>
                                        <strong>Private key stored in IndexedDB</strong>
                                        <small>
                                            Fingerprint: {formatFingerprint(keyRecord?.fingerprint)}
                                        </small>
                                    </div>
                                </div>
                                <button className="setting-action" onClick={rotateKeys} disabled={busy}>
                  <span>
                    <Icon name="key" size={19}/>
                    <span>
                      <strong>{busy ? 'Rotating key…' : 'Rotate encryption key'}</strong>
                      <small>Uploads a replacement public key through POST /api/keys.</small>
                    </span>
                  </span>
                                    <Icon name="arrowRight" size={18}/>
                                </button>
                                <button className="setting-action" onClick={downloadPublicKey} disabled={!keyRecord}>
                  <span>
                    <Icon name="download" size={19}/>
                    <span>
                      <strong>Download public key</strong>
                      <small>The private key is never included.</small>
                    </span>
                  </span>
                                    <Icon name="arrowRight" size={18}/>
                                </button>
                            </>
                        )}

                        {activeTab === 'Devices' && (
                            <>
                                <div className="settings-panel-heading">
                                    <h2>Devices</h2>
                                    <p>The backend does not expose device or session-management APIs.</p>
                                </div>
                                <div className="device-card">
                                    <Icon name="device" size={20}/>
                                    <div>
                                        <strong>This browser</strong>
                                        <small>{navigator.userAgent}</small>
                                    </div>
                                    <span className="current-device">Current</span>
                                </div>
                                <div className="backend-limit-card">
                                    <Icon name="lock" size={19}/>
                                    <div>
                                        <strong>No remote device logout</strong>
                                        <small>Only the current JWT can be blacklisted through POST
                                            /api/auth/logout.</small>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'Notifications' && (
                            <>
                                <div className="settings-panel-heading">
                                    <h2>Notifications</h2>
                                    <p>Desktop notifications are triggered by live Socket.IO messages.</p>
                                </div>
                                <Toggle
                                    label="Desktop notifications"
                                    description="Show a browser notification when a live message arrives while the tab is hidden."
                                    checked={settings.desktopNotifications}
                                    onChange={(event) => requestNotifications(event.target.checked)}
                                />
                                <Toggle
                                    label="Security email alerts"
                                    description="No backend endpoint currently supports this feature."
                                    checked={false}
                                    disabled
                                    onChange={() => {
                                    }}
                                />
                            </>
                        )}

                        {activeTab === 'Appearance' && (
                            <>
                                <div className="settings-panel-heading">
                                    <h2>Appearance</h2>
                                    <p>Theme selection is stored locally.</p>
                                </div>
                                <div className="appearance-options">
                                    <button
                                        className={`appearance-card ${settings.theme === 'light' ? 'active' : ''}`}
                                        onClick={() => dispatch(setTheme('light'))}
                                    >
                                        <span className="light-preview"/>
                                        <strong>Light</strong>
                                        <small>Use the light theme</small>
                                    </button>
                                    <button
                                        className={`appearance-card ${settings.theme === 'dark' ? 'active' : ''}`}
                                        onClick={() => dispatch(setTheme('dark'))}
                                    >
                                        <span className="dark-preview"/>
                                        <strong>Dark</strong>
                                        <small>Use the dark theme</small>
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    )
}
