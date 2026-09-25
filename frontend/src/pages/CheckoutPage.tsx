import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useCart } from '../context/CartContext'

import './CheckoutPage.css'

function CheckoutPage() {
    const navigate = useNavigate()

    const {
        items,
        subtotal,
    } = useCart()

    const [fullName, setFullName] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [pincode, setPincode] = useState('')
    const [phone, setPhone] = useState('')

    if (items.length === 0) {
        return (
            <main className="checkout-page">
                <div className="checkout-empty">
                    <span className="checkout-empty-icon">
                        🛒
                    </span>

                    <h1>Your cart is empty</h1>

                    <p>
                        Add products before proceeding
                        to checkout.
                    </p>

                    <Link
                        to="/#products"
                        className="checkout-continue-button"
                    >
                        Continue shopping
                    </Link>
                </div>
            </main>
        )
    }

    function handleSubmit(
        event: React.SyntheticEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        navigate('/checkout/payment', {
            state: {
                fullName,
                phone,
                address,
                city,
                state,
                pincode,
            },
        })
    }

    return (
        <main className="checkout-page">
            <div className="checkout-container">
                <Link
                    to="/cart"
                    className="checkout-back-link"
                >
                    ← Back to cart
                </Link>

                <div className="checkout-header">
                    <span className="checkout-eyebrow">
                        Checkout
                    </span>

                    <h1>Complete your order</h1>

                    <p>
                        Enter your delivery details
                        to continue.
                    </p>
                </div>

                <div className="checkout-layout">
                    <form
                        className="checkout-form"
                        onSubmit={handleSubmit}
                    >
                        <section className="checkout-card">
                            <div className="checkout-card-header">
                                <div>
                                    <span>
                                        01
                                    </span>

                                    <h2>
                                        Delivery
                                        information
                                    </h2>
                                </div>
                            </div>

                            <div className="checkout-fields">
                                <label>
                                    Full name

                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(event) =>
                                            setFullName(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </label>

                                <label>
                                    Phone number

                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(event) =>
                                            setPhone(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                </label>

                                <label className="checkout-field-full">
                                    Address

                                    <textarea
                                        value={address}
                                        onChange={(event) =>
                                            setAddress(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="House number, street and area"
                                        rows={3}
                                        required
                                    />
                                </label>

                                <label>
                                    City

                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(event) =>
                                            setCity(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="City"
                                        required
                                    />
                                </label>

                                <label>
                                    State

                                    <input
                                        type="text"
                                        value={state}
                                        onChange={(event) =>
                                            setState(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="State"
                                        required
                                    />
                                </label>

                                <label>
                                    PIN code

                                    <input
                                        type="text"
                                        value={pincode}
                                        onChange={(event) =>
                                            setPincode(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="PIN code"
                                        maxLength={6}
                                        required
                                    />
                                </label>
                            </div>
                        </section>

                        <button
                            type="submit"
                            className="checkout-continue-button checkout-submit-button"
                        >
                            Continue to payment
                            <span>→</span>
                        </button>
                    </form>

                    <aside className="checkout-summary">
                        <span className="checkout-summary-label">
                            Order summary
                        </span>

                        <h2>
                            Your order
                        </h2>

                        <div className="checkout-products">
                            {items.map((item) => (
                                <div
                                    key={
                                        item.product.id
                                    }
                                    className="checkout-product"
                                >
                                    <div className="checkout-product-image">
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

                        <div className="checkout-summary-row">
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

                        <div className="checkout-summary-row">
                            <span>
                                Delivery
                            </span>

                            <span>
                                Free
                            </span>
                        </div>

                        <div className="checkout-summary-divider" />

                        <div className="checkout-total">
                            <span>Total</span>

                            <strong>
                                ₹
                                {subtotal.toLocaleString(
                                    'en-IN',
                                )}
                            </strong>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    )
}

export default CheckoutPage