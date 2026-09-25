import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getAdminUsers,
} from '../../services/adminUserService'

import type {
  User,
} from '../../services/authService'

import './AdminUsersPage.css'

const ROLE_OPTIONS = [
  'ALL',
  'ADMIN',
  'CUSTOMER',
] as const

const STATUS_OPTIONS = [
  'ALL',
  'ACTIVE',
  'INACTIVE',
] as const

type RoleFilter =
  (typeof ROLE_OPTIONS)[number]

type StatusFilter =
  (typeof STATUS_OPTIONS)[number]

function formatDate(
  value: string,
): string {
  return new Date(value).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  )
}

function formatRole(
  role: string,
): string {
  return role
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
}

function AdminUsersPage() {
  const [users, setUsers] =
    useState<User[]>([])

  const [search, setSearch] =
    useState('')

  const [roleFilter, setRoleFilter] =
    useState<RoleFilter>('ALL')

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('ALL')

  const [selectedUserId, setSelectedUserId] =
    useState<number | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  async function loadUsers() {
    try {
      setIsLoading(true)
      setError('')

      const data =
        await getAdminUsers()

      setUsers(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load users',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const filteredUsers =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase()

      return users.filter(
        (user) => {
          const matchesSearch =
            !normalizedSearch ||
            user.name
              .toLowerCase()
              .includes(normalizedSearch) ||
            user.email
              .toLowerCase()
              .includes(normalizedSearch) ||
            user.mobile_number.includes(
              normalizedSearch,
            )

          const matchesRole =
            roleFilter === 'ALL' ||
            user.role === roleFilter

          const matchesStatus =
            statusFilter === 'ALL' ||
            (statusFilter === 'ACTIVE'
              ? user.is_active
              : !user.is_active)

          return (
            matchesSearch &&
            matchesRole &&
            matchesStatus
          )
        },
      )
    }, [
      users,
      search,
      roleFilter,
      statusFilter,
    ])

  const selectedUser =
    users.find(
      (user) =>
        user.id === selectedUserId,
    ) ?? null

  return (
    <main className="admin-users-page">
      <section className="admin-users-header">
        <div>
          <span className="admin-eyebrow">
            MANAGEMENT
          </span>

          <h1>
            User Management
          </h1>

          <p>
            View registered users and account
            information.
          </p>
        </div>

        <div className="admin-user-count">
          <strong>
            {users.length}
          </strong>

          <span>
            Total Users
          </span>
        </div>
      </section>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <section className="admin-users-card">
        <div className="admin-users-toolbar">
          <div className="admin-user-search">
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search by name, email or mobile..."
              aria-label="Search users"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target
                  .value as RoleFilter,
              )
            }
            aria-label="Filter users by role"
          >
            {ROLE_OPTIONS.map(
              (role) => (
                <option
                  key={role}
                  value={role}
                >
                  {role === 'ALL'
                    ? 'All roles'
                    : formatRole(role)}
                </option>
              ),
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter,
              )
            }
            aria-label="Filter users by status"
          >
            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status === 'ALL'
                    ? 'All status'
                    : formatRole(status)}
                </option>
              ),
            )}
          </select>
        </div>

        {isLoading ? (
          <div className="admin-users-empty">
            Loading users...
          </div>
        ) : filteredUsers.length ===
          0 ? (
          <div className="admin-users-empty">
            <strong>
              No users found
            </strong>

            <span>
              Try changing your search or
              filters.
            </span>
          </div>
        ) : (
          <div className="admin-users-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>
                    User
                  </th>

                  <th>
                    Contact
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Joined
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map(
                  (user) => (
                    <tr
                      key={user.id}
                      className={
                        selectedUserId ===
                        user.id
                          ? 'selected'
                          : ''
                      }
                    >
                      <td>
                        <div className="admin-user-cell">
                          <span className="admin-user-avatar-small">
                            {user.name
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <div>
                            <strong>
                              {user.name}
                            </strong>

                            <span>
                              #{user.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="admin-user-contact">
                          <strong>
                            {user.email}
                          </strong>

                          <span>
                            {user.mobile_number}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-user-role role-${user.role.toLowerCase()}`}
                        >
                          {formatRole(
                            user.role,
                          )}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          user.created_at,
                        )}
                      </td>

                      <td>
                        <span
                          className={`admin-user-status ${
                            user.is_active
                              ? 'active'
                              : 'inactive'
                          }`}
                        >
                          <span
                            className="admin-status-dot"
                            aria-hidden="true"
                          />

                          {user.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-user-view-button"
                          onClick={() =>
                            setSelectedUserId(
                              user.id,
                            )
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedUser && (
        <section className="admin-user-details">
          <div className="admin-user-details-header">
            <div>
              <span className="admin-eyebrow">
                USER DETAILS
              </span>

              <h2>
                {selectedUser.name}
              </h2>
            </div>

            <button
              type="button"
              className="admin-user-close-button"
              onClick={() =>
                setSelectedUserId(null)
              }
              aria-label="Close user details"
            >
              ×
            </button>
          </div>

          <div className="admin-user-details-grid">
            <div>
              <span>
                Full Name
              </span>

              <strong>
                {selectedUser.name}
              </strong>
            </div>

            <div>
              <span>
                Email
              </span>

              <strong>
                {selectedUser.email}
              </strong>
            </div>

            <div>
              <span>
                Mobile
              </span>

              <strong>
                {selectedUser.mobile_number}
              </strong>
            </div>

            <div>
              <span>
                Role
              </span>

              <strong>
                {formatRole(
                  selectedUser.role,
                )}
              </strong>
            </div>

            <div>
              <span>
                Account Status
              </span>

              <strong>
                {selectedUser.is_active
                  ? 'Active'
                  : 'Inactive'}
              </strong>
            </div>

            <div>
              <span>
                Joined
              </span>

              <strong>
                {formatDate(
                  selectedUser.created_at,
                )}
              </strong>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default AdminUsersPage