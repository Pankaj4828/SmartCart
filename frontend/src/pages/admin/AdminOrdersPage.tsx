import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getAdminOrders,
  updateAdminOrderStatus,
  type AdminOrderStatus,
} from '../../services/adminOrderService'

import type {
  Order,
} from '../../services/orderService'

import './AdminOrdersPage.css'

const STATUS_OPTIONS = [
  'ALL',
  'PLACED',
  'CONFIRMED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const

type StatusFilter =
  (typeof STATUS_OPTIONS)[number]

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

function getNextStatus(
  status: string,
): AdminOrderStatus | null {
  switch (status) {
    case 'PLACED':
      return 'CONFIRMED'

    case 'CONFIRMED':
      return 'SHIPPED'

    case 'SHIPPED':
      return 'OUT_FOR_DELIVERY'

    case 'OUT_FOR_DELIVERY':
      return 'DELIVERED'

    default:
      return null
  }
}

function AdminOrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([])

  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('ALL')

  const [selectedOrderId, setSelectedOrderId] =
    useState<number | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [updatingOrderId, setUpdatingOrderId] =
    useState<number | null>(null)

  const [error, setError] =
    useState('')

  async function loadOrders() {
    try {
      setIsLoading(true)
      setError('')

      const data =
        await getAdminOrders()

      setOrders(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load orders',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const filteredOrders =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase()

      return orders.filter(
        (order) => {
          const matchesSearch =
            !normalizedSearch ||
            order.id
              .toString()
              .includes(normalizedSearch) ||
            order.customer_name
              .toLowerCase()
              .includes(normalizedSearch) ||
            order.phone.includes(
              normalizedSearch,
            )

          const matchesStatus =
            statusFilter === 'ALL' ||
            order.status === statusFilter

          return (
            matchesSearch &&
            matchesStatus
          )
        },
      )
    }, [
      orders,
      search,
      statusFilter,
    ])

  const selectedOrder =
    orders.find(
      (order) =>
        order.id === selectedOrderId,
    ) ?? null

  async function handleStatusUpdate(
    order: Order,
  ) {
    const nextStatus =
      getNextStatus(order.status)

    if (!nextStatus) {
      return
    }

    try {
      setUpdatingOrderId(order.id)
      setError('')

      const updated =
        await updateAdminOrderStatus(
          order.id,
          nextStatus,
        )

      setOrders((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update order status',
      )
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <main className="admin-orders-page">
      <section className="admin-orders-header">
        <div>
          <span className="admin-eyebrow">
            MANAGEMENT
          </span>

          <h1>
            Order Management
          </h1>

          <p>
            View customer orders and manage
            fulfillment status.
          </p>
        </div>

        <div className="admin-order-count">
          <strong>
            {orders.length}
          </strong>

          <span>
            Total Orders
          </span>
        </div>
      </section>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <section className="admin-orders-card">
        <div className="admin-orders-toolbar">
          <div className="admin-order-search">
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
              placeholder="Search by order, customer or phone..."
              aria-label="Search orders"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter,
              )
            }
            aria-label="Filter orders by status"
          >
            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status === 'ALL'
                    ? 'All statuses'
                    : formatStatus(status)}
                </option>
              ),
            )}
          </select>
        </div>

        {isLoading ? (
          <div className="admin-orders-empty">
            Loading orders...
          </div>
        ) : filteredOrders.length ===
          0 ? (
          <div className="admin-orders-empty">
            <strong>
              No orders found
            </strong>

            <span>
              Try changing your search or
              status filter.
            </span>
          </div>
        ) : (
          <div className="admin-orders-table-wrapper">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>
                    Order
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Amount
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
                {filteredOrders.map(
                  (order) => {
                    const nextStatus =
                      getNextStatus(
                        order.status,
                      )

                    return (
                      <tr
                        key={order.id}
                        className={
                          selectedOrderId ===
                          order.id
                            ? 'selected'
                            : ''
                        }
                      >
                        <td>
                          <strong>
                            #{order.id}
                          </strong>
                        </td>

                        <td>
                          <div className="admin-order-customer">
                            <strong>
                              {
                                order.customer_name
                              }
                            </strong>

                            <span>
                              {order.phone}
                            </span>
                          </div>
                        </td>

                        <td>
                          {formatDate(
                            order.created_at,
                          )}
                        </td>

                        <td>
                          ₹
                          {order.total_amount.toLocaleString(
                            'en-IN',
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </td>

                        <td>
                          <span
                            className={`admin-order-status status-${order.status.toLowerCase()}`}
                          >
                            {formatStatus(
                              order.status,
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="admin-order-actions">
                            <button
                              type="button"
                              className="admin-view-button"
                              onClick={() =>
                                setSelectedOrderId(
                                  order.id,
                                )
                              }
                            >
                              View
                            </button>

                            {nextStatus && (
                              <button
                                type="button"
                                className="admin-status-button"
                                disabled={
                                  updatingOrderId ===
                                  order.id
                                }
                                onClick={() =>
                                  void handleStatusUpdate(
                                    order,
                                  )
                                }
                              >
                                {updatingOrderId ===
                                order.id
                                  ? 'Updating...'
                                  : formatStatus(
                                      nextStatus,
                                    )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedOrder && (
        <section className="admin-order-details">
          <div className="admin-order-details-header">
            <div>
              <span className="admin-eyebrow">
                ORDER DETAILS
              </span>

              <h2>
                Order #{selectedOrder.id}
              </h2>
            </div>

            <button
              type="button"
              className="admin-close-button"
              onClick={() =>
                setSelectedOrderId(null)
              }
              aria-label="Close order details"
            >
              ×
            </button>
          </div>

          <div className="admin-order-summary-grid">
            <div>
              <span>
                Customer
              </span>

              <strong>
                {
                  selectedOrder.customer_name
                }
              </strong>
            </div>

            <div>
              <span>
                Payment
              </span>

              <strong>
                {selectedOrder.payment_method}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <strong>
                {formatStatus(
                  selectedOrder.status,
                )}
              </strong>
            </div>

            <div>
              <span>
                Total
              </span>

              <strong>
                ₹
                {selectedOrder.total_amount.toLocaleString(
                  'en-IN',
                  {
                    minimumFractionDigits: 2,
                  },
                )}
              </strong>
            </div>
          </div>

          <div className="admin-order-address">
            <span>
              Delivery Address
            </span>

            <p>
              {selectedOrder.address},{' '}
              {selectedOrder.city},{' '}
              {selectedOrder.state} -{' '}
              {selectedOrder.pincode}
            </p>
          </div>

          <div className="admin-order-items">
            <h3>
              Items
            </h3>

            {selectedOrder.items.map(
              (item) => (
                <div
                  key={item.id}
                  className="admin-order-item"
                >
                  <div>
                    <strong>
                      {item.product_name}
                    </strong>

                    <span>
                      Qty: {item.quantity}
                    </span>
                  </div>

                  <strong>
                    ₹
                    {(
                      item.price *
                      item.quantity
                    ).toLocaleString(
                      'en-IN',
                      {
                        minimumFractionDigits: 2,
                      },
                    )}
                  </strong>
                </div>
              ),
            )}
          </div>
        </section>
      )}
    </main>
  )
}

export default AdminOrdersPage