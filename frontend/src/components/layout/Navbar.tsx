import {
  useNavigate,
  NavLink,
} from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

interface NavbarProps {
  search: string
  onSearchChange: (value: string) => void
}

function Navbar({
  search,
  onSearchChange,
}: NavbarProps) {
  const navigate = useNavigate()
  const { itemCount } = useCart()

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth()

  const {
    theme,
    toggleTheme,
  } = useTheme()

  return (
    <header className="navbar">
      <a
        href="#"
        className="brand"
        aria-label="SmartCart home"
      >
        <span
          className="brand-icon"
          aria-hidden="true"
        >
          🛒
        </span>

        <span>SmartCart</span>
      </a>

      <div className="navbar-search">
        <span
          className="navbar-search-icon"
          aria-hidden="true"
        >
          ⌕
        </span>

        <input
          type="search"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search products..."
          aria-label="Search products"
        />

        {search && (
          <button
            type="button"
            className="navbar-search-clear"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <nav
        className="nav-links"
        aria-label="Primary navigation"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-link ${isActive ? 'active' : ''
            }`
          }
        >
          Products
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `nav-link ${isActive ? 'active' : ''
            }`
          }
        >
          Orders
        </NavLink>

        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            `nav-link wishlist-link ${isActive ? 'active' : ''}`
          }
          aria-label="Wishlist"
        >
          ♡
        </NavLink>
        {isAuthenticated ? (
          <>
            {user?.role === 'ADMIN' && (
              <NavLink
                to="/admin/products"
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                Admin
              </NavLink>
            )}
            <span
              className="nav-user"
              title={user?.email}
            >
              👤 {user?.name}
            </span>

            <button
              type="button"
              className="nav-auth-button"
              onClick={logout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''
                }`
              }
            >
              Sign in
            </NavLink>

            <NavLink
              to="/register"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''
                }`
              }
            >
              Register
            </NavLink>
          </>
        )}
      </nav>

      <button
        type="button"
        className={`theme-toggle ${theme === 'dark' ? 'dark' : ''
          }`}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        <span
          className="theme-toggle-icon theme-toggle-sun"
          aria-hidden="true"
        >
          ☀
        </span>

        <span
          className="theme-toggle-icon theme-toggle-moon"
          aria-hidden="true"
        >
          ☾
        </span>

        <span
          className="theme-toggle-thumb"
          aria-hidden="true"
        />
      </button>

      <button
        type="button"
        className="cart-button"
        aria-label={`Open shopping cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
        onClick={() => navigate('/cart')}
      >
        <span aria-hidden="true">🛒</span>
        <span>Cart</span>

        {itemCount > 0 && (
          <span className="cart-count">
            {itemCount}
          </span>
        )}
      </button>
    </header>
  )
}

export default Navbar