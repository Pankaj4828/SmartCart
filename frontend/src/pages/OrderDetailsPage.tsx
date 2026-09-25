import {
    useEffect,
    useState,
} from 'react'

import {
    Link,
    useNavigate,
    useParams,
} from 'react-router-dom'

import {
    cancelOrder,
    getOrder,
    type Order,
} from '../services/orderService'

import './OrderDetailsPage.css'

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
            month: 'long',
            year: 'numeric',
        },
    )
}

const ORDER_TRACKING_STEPS = [
    {
        status: 'PLACED',
        label: 'Order placed',
    },
    {
        status: 'CONFIRMED',
        label: 'Order confirmed',
    },
    {
        status: 'SHIPPED',
        label: 'Shipped',
    },
    {
        status: 'OUT_FOR_DELIVERY',
        label: 'Out for delivery',
    },
    {
        status: 'DELIVERED',
        label: 'Delivered',
    },
]

function OrderDetailsPage() {
    const {
        orderId,
    } = useParams()

    const navigate =
        useNavigate()

    const [order, setOrder] =
        useState<Order | null>(null)

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState('')

    const [cancelling, setCancelling] =
        useState(false)

    useEffect(() => {
        async function loadOrder() {
            if (!orderId) {
                setError(
                    'Order ID is missing.',
                )
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError('')

                const data =
                    await getOrder(
                        Number(orderId),
                    )

                setOrder(data)
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load order',
                )
            } finally {
                setLoading(false)
            }
        }

        loadOrder()
    }, [orderId])

    async function handleCancelOrder() {
        if (!order) {
            return
        }

        const confirmed =
            window.confirm(
                'Are you sure you want to cancel this order?',
            )

        if (!confirmed) {
            return
        }

        try {
            setCancelling(true)
            setError('')

            const updatedOrder =
                await cancelOrder(
                    order.id,
                )

            setOrder(updatedOrder)
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to cancel order',
            )
        } finally {
            setCancelling(false)
        }
    }

    if (loading) {
        return (
            <main className="order-details-page">
                <div className="order-details-container">
                    <div className="order-details-loading">
                        Loading order...
                    </div>
                </div>
            </main>
        )
    }

    if (error && !order) {
        return (
            <main className="order-details-page">
                <div className="order-details-container">
                    <Link
                        to="/orders"
                        className="order-back-link"
                    >
                        ← Back to orders
                    </Link>

                    <div className="order-details-state">
                        <span className="order-state-icon">
                            ⚠️
                        </span>

                        <h1>
                            Unable to load order
                        </h1>

                        <p>
                            {error}
                        </p>

                        <Link
                            to="/orders"
                            className="order-primary-button"
                        >
                            Back to orders
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    if (!order) {
        return null
    }

    const canCancel =
        order.status === 'PLACED' ||
        order.status === 'CONFIRMED'

    const currentTrackingIndex =
        ORDER_TRACKING_STEPS.findIndex(
            (step) =>
                step.status === order.status,
        )

    const isCancelled =
        order.status === 'CANCELLED'

    const totalItems =
        order.items.reduce(
            (
                total,
                item,
            ) =>
                total +
                item.quantity,
            0,
        )

    return (
        <main className="order-details-page">
            <div className="order-details-container">
                <Link
                    to="/orders"
                    className="order-back-link"
                >
                    ← Back to orders
                </Link>

                <header className="order-details-header">
                    <div>
                        <span className="order-details-eyebrow">
                            Order details
                        </span>

                        <h1>
                            Order #
                            {order.id}
                        </h1>

                        <p>
                            Placed on{' '}
                            {formatDate(
                                order.created_at,
                            )}
                        </p>
                    </div>

                    <span
                        className={`order-details-status order-details-status-${order.status.toLowerCase()}`}
                    >
                        {order.status}
                    </span>
                </header>

                {error && (
                    <div className="order-details-error">
                        {error}
                    </div>
                )}

                <section className="order-details-card order-tracking-card">
                    <div className="order-section-heading">
                        <span>
                            Order tracking
                        </span>

                        <h2>
                            Delivery progress
                        </h2>
                    </div>

                    <div className="order-tracking">
                        {isCancelled ? (
                            <>
                                <div className="order-tracking-step completed">
                                    <div className="order-tracking-marker">
                                        ✓
                                    </div>

                                    <div className="order-tracking-content">
                                        <strong>
                                            Order placed
                                        </strong>

                                        <span>
                                            Your order was successfully placed.
                                        </span>
                                    </div>
                                </div>

                                <div className="order-tracking-step cancelled">
                                    <div className="order-tracking-marker">
                                        ×
                                    </div>

                                    <div className="order-tracking-content">
                                        <strong>
                                            Order cancelled
                                        </strong>

                                        <span>
                                            This order has been cancelled.
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            ORDER_TRACKING_STEPS.map(
                                (step, index) => {
                                    const isCompleted =
                                        index <=
                                        currentTrackingIndex

                                    const isCurrent =
                                        index ===
                                        currentTrackingIndex

                                    return (
                                        <div
                                            key={step.status}
                                            className={`order-tracking-step ${isCompleted
                                                    ? 'completed'
                                                    : ''
                                                } ${isCurrent
                                                    ? 'current'
                                                    : ''
                                                }`}
                                        >
                                            <div className="order-tracking-marker">
                                                {isCompleted
                                                    ? '✓'
                                                    : ''}
                                            </div>

                                            <div className="order-tracking-content">
                                                <strong>
                                                    {step.label}
                                                </strong>

                                                <span>
                                                    {isCurrent
                                                        ? 'Current order status'
                                                        : isCompleted
                                                            ? 'Completed'
                                                            : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                },
                            )
                        )}
                    </div>
                </section>

                <section className="order-details-grid">
                    <div className="order-details-main">
                        <section className="order-details-card">
                            <div className="order-section-heading">
                                <div>
                                    <span>
                                        Your order
                                    </span>

                                    <h2>
                                        {totalItems}{' '}
                                        {totalItems ===
                                            1
                                            ? 'item'
                                            : 'items'}
                                    </h2>
                                </div>
                            </div>

                            <div className="order-items-list">
                                {order.items.map(
                                    (
                                        item,
                                    ) => (
                                        <div
                                            key={
                                                item.id
                                            }
                                            className="order-details-item"
                                        >
                                            <div className="order-details-item-image">
                                                🛍️
                                            </div>

                                            <div className="order-details-item-info">
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

                                                <span>
                                                    {formatPrice(
                                                        item.price,
                                                    )}{' '}
                                                    each
                                                </span>
                                            </div>

                                            <strong className="order-details-item-total">
                                                {formatPrice(
                                                    item.price *
                                                    item.quantity,
                                                )}
                                            </strong>
                                        </div>
                                    ),
                                )}
                            </div>

                            <div className="order-total-row">
                                <span>
                                    Order total
                                </span>

                                <strong>
                                    {formatPrice(
                                        order.total_amount,
                                    )}
                                </strong>
                            </div>
                        </section>

                        <section className="order-details-card">
                            <div className="order-section-heading">
                                <span>
                                    Delivery
                                </span>

                                <h2>
                                    Delivery
                                    address
                                </h2>
                            </div>

                            <div className="delivery-details">
                                <strong>
                                    {
                                        order.customer_name
                                    }
                                </strong>

                                <span>
                                    {
                                        order.phone
                                    }
                                </span>

                                <span>
                                    {
                                        order.address
                                    }
                                </span>

                                <span>
                                    {
                                        order.city
                                    }
                                    ,{' '}
                                    {
                                        order.state
                                    }{' '}
                                    {
                                        order.pincode
                                    }
                                </span>
                            </div>
                        </section>
                    </div>

                    <aside className="order-details-sidebar">
                        <section className="order-details-card">
                            <div className="order-section-heading">
                                <span>
                                    Payment
                                </span>

                                <h2>
                                    Payment
                                    method
                                </h2>
                            </div>

                            <div className="payment-method">
                                <span className="payment-method-icon">
                                    💳
                                </span>

                                <div>
                                    <strong>
                                        {
                                            order.payment_method
                                        }
                                    </strong>

                                    <span>
                                        Payment
                                        method
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="order-details-card order-status-card">
                            <span className="order-section-label">
                                Current status
                            </span>

                            <h2>
                                {
                                    order.status
                                }
                            </h2>

                            <p>
                                Your order
                                status is
                                updated
                                based on
                                the latest
                                order
                                information.
                            </p>

                            {canCancel && (
                                <button
                                    type="button"
                                    className="order-cancel-button"
                                    onClick={
                                        handleCancelOrder
                                    }
                                    disabled={
                                        cancelling
                                    }
                                >
                                    {cancelling
                                        ? 'Cancelling...'
                                        : 'Cancel order'}
                                </button>
                            )}
                        </section>
                    </aside>
                </section>

                <div className="order-details-footer">
                    <button
                        type="button"
                        className="order-secondary-button"
                        onClick={() =>
                            navigate(
                                '/orders',
                            )
                        }
                    >
                        Back to my orders
                    </button>
                </div>
            </div>
        </main>
    )
}

export default OrderDetailsPage