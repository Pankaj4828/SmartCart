import {
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

function AdminNavbar() {
  const navigate = useNavigate()

  const {
    user,
    logout,
  } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-brand">
        <button
          type="button"
          className="admin-brand-button"
          onClick={() => navigate('/admin')}
        >
          <span
            className="admin-brand-icon"
            aria-hidden="true"
          >
            🛒
          </span>

          <span>
            <strong>SmartCart</strong>
            <small>Admin Portal</small>
          </span>
        </button>
      </div>

      <div className="admin-navbar-actions">
        <button
          type="button"
          className="admin-store-button"
          onClick={() => navigate('/')}
        >
          View Store
        </button>

        <div className="admin-user">
          <span className="admin-user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </span>

          <div className="admin-user-info">
            <strong>{user?.name}</strong>
            <span>Administrator</span>
          </div>
        </div>

        <button
          type="button"
          className="admin-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  )
}

export default AdminNavbar