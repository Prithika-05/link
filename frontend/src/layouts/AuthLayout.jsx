import Brand from '../components/common/Brand'

export default function AuthLayout({children, aside = true}) {
    return (
        <main className={`auth-page ${aside ? '' : 'auth-page-centered'}`}>
            <section className="auth-panel">
                <Brand/>
                <div className="auth-content">{children}</div>
            </section>
            {aside && (
                <aside className="auth-aside">
                    <div className="auth-orb orb-one"/>
                    <div className="auth-orb orb-two"/>
                    <div className="security-preview">
                        <span className="preview-icon">✦</span>
                        <p className="preview-quote">
                            “Private conversations should feel private.”
                        </p>
                        <div className="preview-encryption">
                            <span>End-to-end encrypted</span>
                            <span className="live-pulse"/>
                        </div>
                    </div>
                    <div className="aside-copy">
                        <span className="eyebrow">PRIVATE BY DESIGN</span>
                        <h2>Built for conversations that stay yours.</h2>
                        <p>Messages are protected before they leave your device.</p>
                    </div>
                </aside>
            )}
        </main>
    )
}
