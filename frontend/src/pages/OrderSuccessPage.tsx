import {
    Link,
    useLocation,
} from 'react-router-dom'

import type { Order } from '../services/orderService'

import './OrderSuccessPage.css'

interface OrderSuccessLocationState {
    order?: Order
}

function OrderSuccessPage() {
    const location = useLocation()

    const state =
        location.state as
            | OrderSuccessLocationState
            | null

    const order = state?.order

    if (!order) {
        return (
            <main className="order-success-page">
                <div className="order-success-card">
                    <span className="order-success-icon">
                        !
                    </span>

                    <h1>
                        Order information unavailable
                    </h1>

                    <p>
                        We couldn't find the order
                        information for this page.
                    </p>

                    <Link
                        to="/"
                        className="order-success-button"
                    >
                        Continue shopping
                    </Link>
                </div>
            </main>
        )
    }

    return (
        <main className="order-success-page">
            <div className="order-success-card">
                <div className="order-success-icon">
                    ✓
                </div>

                <span className="order-success-eyebrow">
                    Order confirmed
                </span>

                <h1>
                    Thank you for your order!
                </h1>

                <p>
                    Your order has been placed
                    successfully.
                </p>

                <div className="order-success-details">
                    <div>
                        <span>
                            Order number
                        </span>

                        <strong>
                            #{order.id}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Status
                        </span>

                        <strong>
                            {order.status}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Total
                        </span>

                        <strong>
                            ₹
                            {order.total_amount.toLocaleString(
                                'en-IN',
                            )}
                        </strong>
                    </div>
                </div>

                <div className="order-success-actions">
                    <Link
                        to="/orders"
                        className="order-success-button"
                    >
                        View my orders
                    </Link>

                    <Link
                        to="/#products"
                        className="order-success-secondary-button"
                    >
                        Continue shopping
                    </Link>
                </div>
            </div>
        </main>
    )
}

export default OrderSuccessPage