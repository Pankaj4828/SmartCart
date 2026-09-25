import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getAdminProducts,
} from '../../services/adminProductService'

import {
  getAdminOrders,
} from '../../services/adminOrderService'

import {
  getAdminUsers,
} from '../../services/adminUserService'

import type {
  Product,
} from '../../types/product'

import type {
  Order,
} from '../../services/orderService'

import type {
  User,
} from '../../services/authService'

import './AdminDashboardPage.css'

function formatStatus(
  status: string,
): string {
  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
}

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

function formatCurrency(
  value: number,
): string {
  return `₹${value.toLocaleString(
    'en-IN',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  )}`
}

function AdminDashboardPage() {
  const [products, setProducts] =
    useState<Product[]>([])

  const [orders, setOrders] =
    useState<Order[]>([])

  const [users, setUsers] =
    useState<User[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true)
        setError('')

        const [
          productData,
          orderData,
          userData,
        ] = await Promise.all([
          getAdminProducts(),
          getAdminOrders(),
          getAdminUsers(),
        ])

        setProducts(productData)
        setOrders(orderData)
        setUsers(userData)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadDashboard()
  }, [])

  const statistics = useMemo(() => {
    const activeProducts =
      products.filter(
        (product) =>
          product.is_active,
      ).length

    const inactiveProducts =
      products.length -
      activeProducts

    const activeUsers =
      users.filter(
        (user) =>
          user.is_active,
      ).length

    const customerCount =
      users.filter(
        (user) =>
          user.role === 'CUSTOMER',
      ).length

    const pendingOrders =
      orders.filter(
        (order) =>
          order.status === 'PLACED' ||
          order.status === 'CONFIRMED',
      ).length

    const totalRevenue =
      orders
        .filter(
          (order) =>
            order.status !==
            'CANCELLED',
        )
        .reduce(
          (total, order) =>
            total +
            order.total_amount,
          0,
        )

    return {
      activeProducts,
      inactiveProducts,
      activeUsers,
      customerCount,
      pendingOrders,
      totalRevenue,
    }
  }, [
    products,
    orders,
    users,
  ])

  const recentOrders =
    useMemo(() => {
      return [...orders]
        .sort(
          (a, b) =>
            new Date(
              b.created_at,
            ).getTime() -
            new Date(
              a.created_at,
            ).getTime(),
        )
        .slice(0, 5)
    }, [orders])

  const orderStatusSummary =
    useMemo(() => {
      const statuses = [
        'PLACED',
        'CONFIRMED',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
      ]

      return statuses.map(
        (status) => ({
          status,
          count: orders.filter(
            (order) =>
              order.status ===
              status,
          ).length,
        }),
      )
    }, [orders])

  if (isLoading) {
    return (
      <main className="admin-dashboard-page">
        <div className="admin-dashboard-loading">
          Loading dashboard...
        </div>
      </main>
    )
  }

  return (
    <main className="admin-dashboard-page">
      <section className="admin-dashboard-header">
        <div>
          <span className="admin-eyebrow">
            OVERVIEW
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            A quick overview of your
            SmartCart platform.
          </p>
        </div>
      </section>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            ▣
          </div>

          <div>
            <span>
              Products
            </span>

            <strong>
              {products.length}
            </strong>

            <small>
              {statistics.activeProducts}{' '}
              active ·{' '}
              {statistics.inactiveProducts}{' '}
              inactive
            </small>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            ◫
          </div>

          <div>
            <span>
              Orders
            </span>

            <strong>
              {orders.length}
            </strong>

            <small>
              {statistics.pendingOrders}{' '}
              pending fulfillment
            </small>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            ♙
          </div>

          <div>
            <span>
              Users
            </span>

            <strong>
              {users.length}
            </strong>

            <small>
              {statistics.customerCount}{' '}
              customers ·{' '}
              {statistics.activeUsers}{' '}
              active
            </small>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            ₹
          </div>

          <div>
            <span>
              Revenue
            </span>

            <strong>
              {formatCurrency(
                statistics.totalRevenue,
              )}
            </strong>

            <small>
              Excludes cancelled orders
            </small>
          </div>
        </article>
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-dashboard-card admin-recent-orders">
          <div className="admin-dashboard-card-header">
            <div>
              <span className="admin-card-eyebrow">
                ACTIVITY
              </span>

              <h2>
                Recent Orders
              </h2>
            </div>

            <span className="admin-card-count">
              {orders.length} total
            </span>
          </div>

          {recentOrders.length ===
          0 ? (
            <div className="admin-dashboard-empty">
              No orders yet.
            </div>
          ) : (
            <div className="admin-recent-order-list">
              {recentOrders.map(
                (order) => (
                  <div
                    key={order.id}
                    className="admin-recent-order"
                  >
                    <div className="admin-recent-order-main">
                      <strong>
                        #{order.id}
                      </strong>

                      <div>
                        <strong>
                          {
                            order.customer_name
                          }
                        </strong>

                        <span>
                          {formatDate(
                            order.created_at,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="admin-recent-order-side">
                      <strong>
                        {formatCurrency(
                          order.total_amount,
                        )}
                      </strong>

                      <span
                        className={`admin-dashboard-status status-${order.status.toLowerCase()}`}
                      >
                        {formatStatus(
                          order.status,
                        )}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </article>

        <article className="admin-dashboard-card">
          <div className="admin-dashboard-card-header">
            <div>
              <span className="admin-card-eyebrow">
                FULFILLMENT
              </span>

              <h2>
                Order Status
              </h2>
            </div>
          </div>

          <div className="admin-status-summary">
            {orderStatusSummary.map(
              (item) => (
                <div
                  key={item.status}
                  className="admin-status-summary-row"
                >
                  <div>
                    <span
                      className={`admin-status-dot-large status-dot-${item.status.toLowerCase()}`}
                    />

                    <span>
                      {formatStatus(
                        item.status,
                      )}
                    </span>
                  </div>

                  <strong>
                    {item.count}
                  </strong>
                </div>
              ),
            )}
          </div>
        </article>
      </section>

      <section className="admin-dashboard-card admin-platform-overview">
        <div className="admin-dashboard-card-header">
          <div>
            <span className="admin-card-eyebrow">
              PLATFORM
            </span>

            <h2>
              Platform Overview
            </h2>
          </div>
        </div>

        <div className="admin-platform-grid">
          <div>
            <span>
              Active Products
            </span>

            <strong>
              {statistics.activeProducts}
            </strong>
          </div>

          <div>
            <span>
              Active Users
            </span>

            <strong>
              {statistics.activeUsers}
            </strong>
          </div>

          <div>
            <span>
              Customers
            </span>

            <strong>
              {statistics.customerCount}
            </strong>
          </div>

          <div>
            <span>
              Cancelled Orders
            </span>

            <strong>
              {
                orderStatusSummary.find(
                  (item) =>
                    item.status ===
                    'CANCELLED',
                )?.count ?? 0
              }
            </strong>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboardPage