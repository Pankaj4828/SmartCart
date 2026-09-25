import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
} from 'react-router-dom'

import {
    getOrders,
    type Order,
} from '../services/orderService'

import './OrdersPage.css'

function formatPrice(
    amount: number,
) {
    return `₹${amount.toLocaleString(
        'en-IN',
    )}`
}

function formatDate(
    date: string,
) {
    return new Date(
        date,
    ).toLocaleDateString(
        'en-IN',
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        },
    )
}

function OrdersPage() {
    const [orders, setOrders] =
        useState<Order[]>([])

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState('')

    useEffect(() => {
        async function loadOrders() {
            try {
                setLoading(true)
                setError('')

                const data =
                    await getOrders()

                setOrders(data)
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load orders',
                )
            } finally {
                setLoading(false)
            }
        }

        loadOrders()
    }, [])

    if (loading) {
        return (
            <main className="orders-page">
                <div className="orders-container">
                    <div className="orders-header">
                        <span className="orders-eyebrow">
                            Your account
                        </span>

                        <h1>My Orders</h1>

                        <p>
                            Loading your orders...
                        </p>
                    </div>

                    <div className="orders-loading">
                        Loading orders...
                    </div>
                </div>
            </main>
        )
    }

    if (error) {
        return (
            <main className="orders-page">
                <div className="orders-container">
                    <div className="orders-header">
                        <span className="orders-eyebrow">
                            Your account
                        </span>

                        <h1>My Orders</h1>
                    </div>

                    <div className="orders-state">
                        <h2>
                            Unable to load orders
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                window.location.reload()
                            }
                            className="orders-primary-button"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </main>
        )
    }

    if (orders.length === 0) {
        return (
            <main className="orders-page">
                <div className="orders-container">
                    <div className="orders-header">
                        <span className="orders-eyebrow">
                            Your account
                        </span>

                        <h1>My Orders</h1>

                        <p>
                            View and track your
                            SmartCart orders.
                        </p>
                    </div>

                    <div className="orders-state">
                        <span className="orders-empty-icon">
                            📦
                        </span>

                        <h2>
                            No orders yet
                        </h2>

                        <p>
                            Once you place an
                            order, it will appear
                            here.
                        </p>

                        <Link
                            to="/#products"
                            className="orders-primary-button"
                        >
                            Start shopping
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="orders-page">
            <div className="orders-container">
                <div className="orders-header">
                    <div>
                        <span className="orders-eyebrow">
                            Your account
                        </span>

                        <h1>My Orders</h1>

                        <p>
                            {orders.length}{' '}
                            {orders.length === 1
                                ? 'order'
                                : 'orders'}{' '}
                            placed
                        </p>
                    </div>

                    <Link
                        to="/#products"
                        className="orders-secondary-button"
                    >
                        Continue shopping
                    </Link>
                </div>

                <section className="orders-list">
                    {orders.map(
                        (order) => (
                            <article
                                key={
                                    order.id
                                }
                                className="order-card"
                            >
                                <div className="order-card-header">
                                    <div>
                                        <span className="order-label">
                                            Order
                                            #
                                        </span>

                                        <strong>
                                            #
                                            {
                                                order.id
                                            }
                                        </strong>
                                    </div>

                                    <span
                                        className={`order-status order-status-${order.status.toLowerCase()}`}
                                    >
                                        {
                                            order.status
                                        }
                                    </span>
                                </div>

                                <div className="order-card-meta">
                                    <div>
                                        <span>
                                            Placed
                                        </span>

                                        <strong>
                                            {formatDate(
                                                order.created_at,
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Items
                                        </span>

                                        <strong>
                                            {order.items.reduce(
                                                (
                                                    total,
                                                    item,
                                                ) =>
                                                    total +
                                                    item.quantity,
                                                0,
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Payment
                                        </span>

                                        <strong>
                                            {
                                                order.payment_method
                                            }
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Total
                                        </span>

                                        <strong>
                                            {formatPrice(
                                                order.total_amount,
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="order-card-products">
                                    {order.items.map(
                                        (
                                            item,
                                        ) => (
                                            <div
                                                key={
                                                    item.id
                                                }
                                                className="order-product"
                                            >
                                                <div className="order-product-image">
                                                    🛍️
                                                </div>

                                                <div>
                                                    <strong>
                                                        {
                                                            item.product_name
                                                        }
                                                    </strong>

                                                    <span>
                                                        Qty:{' '}
                                                        {
                                                            item.quantity
                                                        }
                                                    </span>
                                                </div>

                                                <strong>
                                                    {formatPrice(
                                                        item.price *
                                                            item.quantity,
                                                    )}
                                                </strong>
                                            </div>
                                        ),
                                    )}
                                </div>

                                <div className="order-card-footer">
                                    <span>
                                        Delivering
                                        to{' '}
                                        {
                                            order.city
                                        }
                                        ,{' '}
                                        {
                                            order.state
                                        }
                                    </span>

                                    <Link
                                        to={`/orders/${order.id}`}
                                        className="orders-primary-button"
                                    >
                                        View order
                                    </Link>
                                </div>
                            </article>
                        ),
                    )}
                </section>
            </div>
        </main>
    )
}

export default OrdersPage