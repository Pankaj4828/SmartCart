import {
    type ReactNode,
} from 'react'

import {
    NavLink,
} from 'react-router-dom'

import AdminNavbar from './AdminNavbar'

import './AdminLayout.css'

interface AdminLayoutProps {
    children: ReactNode
}

function AdminLayout({
    children,
}: AdminLayoutProps) {
    return (
        <div className="admin-layout">
            <AdminNavbar />

            <div className="admin-body">
                <aside className="admin-sidebar">
                    <div className="admin-sidebar-section">
                        <span className="admin-sidebar-label">
                            Overview
                        </span>

                        <NavLink
                            to="/admin"
                            end
                            className={({ isActive }) =>
                                `admin-sidebar-item ${isActive ? 'active' : ''
                                }`
                            }
                        >
                            <span>▦</span>
                            Dashboard
                        </NavLink>
                    </div>

                    <div className="admin-sidebar-section">
                        <span className="admin-sidebar-label">
                            Management
                        </span>

                        <NavLink
                            to="/admin/products"
                            className={({ isActive }) =>
                                `admin-sidebar-item ${isActive ? 'active' : ''
                                }`
                            }
                        >
                            <span>▣</span>
                            Products
                        </NavLink>

                        <NavLink
                            to="/admin/orders"
                            className={({ isActive }) =>
                                `admin-sidebar-item ${isActive ? 'active' : ''
                                }`
                            }
                        >
                            <span>◫</span>
                            Orders
                        </NavLink>

                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) =>
                                `admin-sidebar-item ${isActive ? 'active' : ''
                                }`
                            }
                        >
                            <span>♙</span>
                            Users
                        </NavLink>
                    </div>

                    <div className="admin-sidebar-section">
                        <span className="admin-sidebar-label">
                            Intelligence
                        </span>

                        <button
                            type="button"
                            className="admin-sidebar-item disabled"
                            disabled
                        >
                            <span>✦</span>
                            AI Assistant
                            <small>Soon</small>
                        </button>
                    </div>

                    <div className="admin-sidebar-footer">
                        <button
                            type="button"
                            className="admin-sidebar-store"
                            onClick={() =>
                                window.location.href = '/'
                            }
                        >
                            ← Back to Store
                        </button>
                    </div>
                </aside>

                <main className="admin-main">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default AdminLayout