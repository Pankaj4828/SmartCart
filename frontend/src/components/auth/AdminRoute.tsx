import {
  Navigate,
  Outlet,
} from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'

function AdminRoute() {
  const {
    user,
    isAuthenticated,
    isLoading,
  } = useAuth()

  if (isLoading) {
    return (
      <div>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (user?.role !== 'ADMIN') {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return <Outlet />
}

export default AdminRoute