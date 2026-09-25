import {
    useState,
    type SubmitEvent,
} from 'react'

import {
    Link,
    useLocation,
    useNavigate,
} from 'react-router-dom'

import { useCart } from '../context/CartContext'
import { createOrder } from '../services/orderService'

import './PaymentPage.css'

interface CheckoutDetails {
    fullName: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
}

function PaymentPage() {
    const location = useLocation()
    const navigate = useNavigate()

    const {
        items,
        subtotal,
        clearCart,
    } = useCart()

    const checkoutDetails =
        location.state as CheckoutDetails | null

    const [paymentMethod, setPaymentMethod] =
        useState('upi')

    const [upiId, setUpiId] = useState('')

    const [cardNumber, setCardNumber] =
        useState('')

    const [expiry, setExpiry] =
        useState('')

    const [cvv, setCvv] =
        useState('')

    const [processing, setProcessing] =
        useState(false)

    if (items.length === 0) {
        return (
            <main className="payment-page">
                <div className="payment-empty">
                    <h1>Your cart is empty</h1>

                    <p>
                        Add products before making a
                        payment.
                    </p>

                    <Link
                        to="/"
                        className="payment-back-button"
                    >
                        Continue shopping
                    </Link>
                </div>
            </main>
        )
    }

    if (!checkoutDetails) {
        return (
            <main className="payment-page">
                <div className="payment-empty">
                    <h1>Checkout information missing</h1>

                    <p>
                        Please return to checkout and
                        enter your delivery details.
                    </p>

                    <Link
                        to="/checkout"
                        className="payment-back-button"
                    >
                        Back to checkout
                    </Link>
                </div>
            </main>
        )
    }
    
    const details = checkoutDetails
    async function handlePayment(
    event: SubmitEvent<HTMLFormElement>,
) {
    event.preventDefault()

    setProcessing(true)

    try {
        const order = await createOrder({
            payment_method:
                paymentMethod.toUpperCase(),

            customer_name:
                details.fullName,

            phone:
                details.phone,

            address:
                details.address,

            city:
                details.city,

            state:
                details.state,

            pincode:
                details.pincode,

            items: items.map((item) => ({
                product_id: item.product.id,
                quantity: item.quantity,
            })),
        })

        clearCart()

        navigate('/order-success', {
            state: {
                order,
            },
        })
    } catch (error) {
        console.error(
            'Order creation failed:',
            error,
        )

        window.alert(
            error instanceof Error
                ? error.message
                : 'Unable to place order. Please try again.',
        )
    } finally {
        setProcessing(false)
    }
}

    return (
        <main className="payment-page">
            <div className="payment-container">
                <Link
                    to="/checkout"
                    className="payment-back-link"
                >
                    ← Back to checkout
                </Link>

                <div className="payment-header">
                    <span className="payment-eyebrow">
                        Payment
                    </span>

                    <h1>
                        Complete your payment
                    </h1>

                    <p>
                        Choose a payment method to
                        place your order.
                    </p>
                </div>

                <div className="payment-layout">
                    <form
                        className="payment-form"
                        onSubmit={handlePayment}
                    >
                        <section className="payment-card">
                            <div className="payment-card-header">
                                <span>02</span>

                                <div>
                                    <h2>
                                        Payment method
                                    </h2>

                                    <p>
                                        Your payment is
                                        simulated for this
                                        project.
                                    </p>
                                </div>
                            </div>

                            <div className="payment-methods">
                                <label
                                    className={
                                        paymentMethod ===
                                        'upi'
                                            ? 'payment-method active'
                                            : 'payment-method'
                                    }
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="upi"
                                        checked={
                                            paymentMethod ===
                                            'upi'
                                        }
                                        onChange={() =>
                                            setPaymentMethod(
                                                'upi',
                                            )
                                        }
                                    />

                                    <span>
                                        <strong>
                                            UPI
                                        </strong>

                                        <small>
                                            Pay using
                                            your UPI ID
                                        </small>
                                    </span>
                                </label>

                                <label
                                    className={
                                        paymentMethod ===
                                        'card'
                                            ? 'payment-method active'
                                            : 'payment-method'
                                    }
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="card"
                                        checked={
                                            paymentMethod ===
                                            'card'
                                        }
                                        onChange={() =>
                                            setPaymentMethod(
                                                'card',
                                            )
                                        }
                                    />

                                    <span>
                                        <strong>
                                            Card
                                        </strong>

                                        <small>
                                            Credit or
                                            debit card
                                        </small>
                                    </span>
                                </label>

                                <label
                                    className={
                                        paymentMethod ===
                                        'cod'
                                            ? 'payment-method active'
                                            : 'payment-method'
                                    }
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={
                                            paymentMethod ===
                                            'cod'
                                        }
                                        onChange={() =>
                                            setPaymentMethod(
                                                'cod',
                                            )
                                        }
                                    />

                                    <span>
                                        <strong>
                                            Cash on
                                            delivery
                                        </strong>

                                        <small>
                                            Pay when your
                                            order arrives
                                        </small>
                                    </span>
                                </label>
                            </div>

                            {paymentMethod ===
                                'upi' && (
                                <div className="payment-fields">
                                    <label>
                                        UPI ID

                                        <input
                                            type="text"
                                            value={upiId}
                                            onChange={(
                                                event,
                                            ) =>
                                                setUpiId(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="example@upi"
                                            required
                                        />
                                    </label>
                                </div>
                            )}

                            {paymentMethod ===
                                'card' && (
                                <div className="payment-fields">
                                    <label>
                                        Card number

                                        <input
                                            type="text"
                                            value={
                                                cardNumber
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setCardNumber(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="1234 5678 9012 3456"
                                            maxLength={
                                                19
                                            }
                                            required
                                        />
                                    </label>

                                    <div className="payment-field-row">
                                        <label>
                                            Expiry

                                            <input
                                                type="text"
                                                value={
                                                    expiry
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setExpiry(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                placeholder="MM/YY"
                                                required
                                            />
                                        </label>

                                        <label>
                                            CVV

                                            <input
                                                type="password"
                                                value={cvv}
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setCvv(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                placeholder="123"
                                                maxLength={
                                                    3
                                                }
                                                required
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {paymentMethod ===
                                'cod' && (
                                <div className="cod-message">
                                    <strong>
                                        Cash on delivery
                                    </strong>

                                    <p>
                                        You will pay when
                                        the order is
                                        delivered.
                                    </p>
                                </div>
                            )}
                        </section>

                        <button
                            type="submit"
                            className="payment-submit-button"
                            disabled={processing}
                        >
                            {processing
                                ? 'Processing payment...'
                                : 'Place order'}
                        </button>
                    </form>

                    <aside className="payment-summary">
                        <span className="payment-summary-label">
                            Order summary
                        </span>

                        <h2>Your order</h2>

                        <div className="payment-products">
                            {items.map((item) => (
                                <div
                                    key={
                                        item.product.id
                                    }
                                    className="payment-product"
                                >
                                    <div className="payment-product-image">
                                        {item.product
                                            .image_url ? (
                                            <img
                                                src={
                                                    item
                                                        .product
                                                        .image_url
                                                }
                                                alt={
                                                    item
                                                        .product
                                                        .name
                                                }
                                            />
                                        ) : (
                                            <span>
                                                No image
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <strong>
                                            {
                                                item
                                                    .product
                                                    .name
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
                                        ₹
                                        {(
                                            item
                                                .product
                                                .price *
                                            item.quantity
                                        ).toLocaleString(
                                            'en-IN',
                                        )}
                                    </strong>
                                </div>
                            ))}
                        </div>

                        <div className="payment-summary-row">
                            <span>
                                Subtotal
                            </span>

                            <strong>
                                ₹
                                {subtotal.toLocaleString(
                                    'en-IN',
                                )}
                            </strong>
                        </div>

                        <div className="payment-summary-row">
                            <span>
                                Delivery
                            </span>

                            <span>Free</span>
                        </div>

                        <div className="payment-summary-divider" />

                        <div className="payment-total">
                            <span>Total</span>

                            <strong>
                                ₹
                                {subtotal.toLocaleString(
                                    'en-IN',
                                )}
                            </strong>
                        </div>

                        <div className="payment-delivery">
                            <strong>
                                Delivering to
                            </strong>

                            <p>
                                {
                                    checkoutDetails.fullName
                                }
                                <br />
                                {
                                    checkoutDetails.address
                                }
                                <br />
                                {
                                    checkoutDetails.city
                                }
                                ,{' '}
                                {
                                    checkoutDetails.state
                                }{' '}
                                {
                                    checkoutDetails.pincode
                                }
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    )
}

export default PaymentPage