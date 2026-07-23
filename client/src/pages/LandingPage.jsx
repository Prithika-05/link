import {Link} from 'react-router-dom'
import Brand from '../components/common/Brand'
import Icon from '../components/common/Icon'

const features = [
    {
        icon: 'lock',
        title: 'Private by default',
        text: 'Your conversations are encrypted before they leave your device.'
    },
    {
        icon: 'key',
        title: 'Keys you control',
        text: 'Your private key stays with you. We never see your message content.'
    },
    {
        icon: 'shield',
        title: 'Identity verification',
        text: 'Compare fingerprints and know exactly who is on the other end.'
    },
]

export default function LandingPage() {
    return (
        <div className="landing-page">
            <header className="landing-nav page-width">
                <Brand/>
                <div className="landing-nav-actions">
                    <Link to="/login" className="text-link">Log in</Link>
                    <Link to="/register" className="button button-primary button-small">Get started <Icon
                        name="arrowRight" size={17}/></Link>
                </div>
            </header>

            <main>
                <section className="hero page-width">
                    <div className="hero-copy">
                        <div className="trust-pill"><Icon name="shield" size={16}/> End-to-end encrypted messaging</div>
                        <h1>Private conversations.<br/><em>Without compromise.</em></h1>
                        <p>Connect with people you trust through a fast, focused messenger built around privacy from the
                            first message.</p>
                        <div className="hero-actions">
                            <Link to="/register" className="button button-primary">Create your account <Icon
                                name="arrowRight" size={18}/></Link>
                            <a href="#how-it-works" className="button button-secondary">How it works</a>
                        </div>
                        <div className="hero-proof"><span><Icon name="check" size={16}/> No ads</span><span><Icon
                            name="check" size={16}/> No tracking</span><span><Icon name="check" size={16}/> No compromise</span>
                        </div>
                    </div>
                    <div className="hero-visual" aria-label="LinkChat product preview">
                        <div className="hero-glow"/>
                        <div className="demo-phone">
                            <div className="phone-bar"><span className="phone-brand"><i/> LinkChat</span><Icon
                                name="more" size={18}/></div>
                            <div className="demo-contact"><span className="avatar avatar-violet avatar-sm">MP<i
                                className="online-dot"/></span><span><b>Maya Patel</b><small><i
                                className="small-online"/> Online</small></span><Icon name="shield" size={18}/></div>
                            <div className="demo-date">Today</div>
                            <div className="demo-bubble incoming">Did you get a chance to review it?<small>10:31
                                AM</small></div>
                            <div className="demo-bubble outgoing">Yes! I added a few comments.<small>10:34 AM <Icon
                                name="check" size={12}/></small></div>
                            <div className="demo-bubble incoming">Perfect. I’ll look at those now.<small>10:36
                                AM</small></div>
                            <div className="demo-composer"><Icon name="plus"
                                                                 size={17}/><span>Message Maya...</span><Icon
                                name="send" size={17}/></div>
                        </div>
                        <div className="floating-card key-card"><Icon name="key" size={18}/><span><b>Your keys, your control</b><small>Private key stored locally</small></span>
                        </div>
                        <div className="floating-card lock-card"><Icon name="lock" size={18}/><span><b>Messages protected</b><small>End-to-end encrypted</small></span>
                        </div>
                    </div>
                </section>

                <section className="feature-section page-width">
                    <div className="section-intro"><span className="eyebrow">A BETTER WAY TO MESSAGE</span>
                        <h2>Everything you need. Nothing you don’t.</h2><p>Clear communication with security built into
                            every interaction.</p></div>
                    <div className="feature-grid">{features.map((feature) => <article className="feature-card"
                                                                                      key={feature.title}><span
                        className="feature-icon"><Icon name={feature.icon} size={23}/></span><h3>{feature.title}</h3>
                        <p>{feature.text}</p></article>)}</div>
                </section>

                <section id="how-it-works" className="how-section">
                    <div className="page-width how-inner">
                        <div><span className="eyebrow">HOW IT WORKS</span><h2>Security that does not get in your
                            way.</h2><p>Set up your account once, then start chatting normally. LinkChat does the
                            difficult work in the background.</p></div>
                        <ol className="steps-list">
                            <li><b>01</b><span><strong>Create your account</strong><small>Join with your email and choose a secure password.</small></span>
                            </li>
                            <li><b>02</b><span><strong>Create your security keys</strong><small>Your public and private keys are generated in your browser.</small></span>
                            </li>
                            <li><b>03</b><span><strong>Start a protected chat</strong><small>Every message is encrypted before sending.</small></span>
                            </li>
                        </ol>
                    </div>
                </section>
            </main>
            <footer className="landing-footer page-width"><Brand/><p>© 2026 LinkChat. Private conversations, by
                design.</p>
                <div><Link to="/login">Log in</Link><Link to="/register">Create account</Link></div>
            </footer>
        </div>
    )
}
