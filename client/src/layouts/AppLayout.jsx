import { NavLink, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand'
import Icon from '../components/Icon'
import { Avatar } from '../components/UI'
import { navItems } from '../data/demoData'

export default function AppLayout({ children, active = 'Chats' }) {
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <aside className="side-nav">
        <Brand />
        <nav className="side-nav-links" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.label} to={item.to} className={({ isActive }) => `side-nav-link ${isActive || active === item.label ? 'active' : ''}`}>
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              {item.label === 'Chats' && <b>4</b>}
            </NavLink>
          ))}
        </nav>
        <div className="side-nav-bottom">
          <button className="sidebar-profile" onClick={() => navigate('/profile')}>
            <Avatar initials="SS" color="violet" size="sm" online />
            <span><strong>Sancia</strong><small>Online</small></span>
            <Icon name="more" size={18} />
          </button>
          <button className="logout-link" onClick={() => navigate('/login')}><Icon name="logout" size={18} /> Log out</button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  )
}
