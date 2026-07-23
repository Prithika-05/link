import {useDispatch, useSelector} from 'react-redux'
import {NavLink, useNavigate} from 'react-router-dom'
import Brand from '../components/common/Brand'
import Icon from '../components/common/Icon'
import {Avatar} from '../components/common/UI'
import {navigationItems} from '../config/navigation'
import {logoutAccount} from '../state/features/auth/authSlice'
import {resetContacts} from '../state/features/contacts/contactsSlice'
import {resetMessages} from '../state/features/messages/messagesSlice'
import {socketService} from '../services/socketService'
import {getInitials} from '../utils/contact'

export default function AppLayout({children}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const unreadByContact = useSelector(
      (state) => state.messages.unreadByContact,
  )
  const {backendStatus, socketStatus} = useSelector((state) => state.system)
  const unreadTotal = Object.values(unreadByContact).reduce(
      (total, value) => total + value,
      0,
  )

  const logout = async () => {
    await dispatch(logoutAccount())
    socketService.disconnect()
    dispatch(resetContacts())
    dispatch(resetMessages())
    navigate('/login', {replace: true})
  }

  return (
      <div className="app-shell">
        <aside className="side-nav">
          <Brand/>
          <nav className="side-nav-links" aria-label="Main navigation">
            {navigationItems.map((item) => (
                <NavLink
                    key={item.label}
                    to={item.to}
                    className={({isActive}) =>
                        `side-nav-link ${isActive ? 'active' : ''}`
                    }
                >
                  <Icon name={item.icon} size={20}/>
                  <span>{item.label}</span>
                  {item.label === 'Chats' && unreadTotal > 0 && <b>{unreadTotal}</b>}
                </NavLink>
            ))}
          </nav>
          <div className="side-nav-bottom">
            <div className="connection-summary" title={`REST: ${backendStatus}; realtime: ${socketStatus}`}>
              <i className={backendStatus === 'connected' ? 'connected' : ''}/>
              <span>
              {backendStatus === 'connected' ? 'API connected' : 'API offline'}
                <small>{socketStatus === 'connected' ? 'Realtime active' : 'Realtime inactive'}</small>
            </span>
            </div>
            <button
                className="sidebar-profile"
                onClick={() => navigate('/profile')}
            >
              <Avatar
                  initials={getInitials(user?.username)}
                  color="violet"
                  size="sm"
                  online={socketStatus === 'connected'}
              />
              <span>
              <strong>{user?.username || 'Account'}</strong>
              <small>{user?.email}</small>
            </span>
              <Icon name="more" size={18}/>
            </button>
            <button className="logout-link" onClick={logout}>
              <Icon name="logout" size={18}/> Log out
            </button>
          </div>
        </aside>
        <main className="app-main">{children}</main>
      </div>
  )
}
