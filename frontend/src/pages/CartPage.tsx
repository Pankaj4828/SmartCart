import {
    Link,
    useNavigate,
} from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './CartPage.css'

function CartPage() {
    const {
        items,
        subtotal,
        updateQuantity,
        removeFromCart,
        clearCart,
    } = useCart()
    const navigate = useNavigate()

    if (items.length === 0) {
        return (
            <main className="cart-page">
                <div className="cart-empty">
                    <span className="cart-empty-icon">
                        🛒
                    </span>

                    <h1>Your cart is empty</h1>

                    <p>
                        Add products to your cart and they
                        will appear here.
                    </p>

                    <button
                        type="button"
                        className="checkout-button"
                        onClick={() => navigate('/checkout')}
                    >
                        Proceed to checkout
                    </button>
                </div>
            </main>
        )
    }

    return (
        <main className="cart-page">
            <div className="cart-container">
                <Link
                    to="/#products"
                    className="cart-back-link"
                >
                    ← Continue shopping
                </Link>
                <div className="cart-header">
                    <div>
                        <span className="cart-eyebrow">
                            Shopping cart
                        </span>

                        <h1>Your Cart</h1>

                        <p>
                            {items.length}{' '}
                            {items.length === 1
                                ? 'product'
                                : 'products'}{' '}
                            · {items.reduce(
                                (total, item) =>
                                    total + item.quantity,
                                0,
                            )}{' '}
                            items
                        </p>
                    </div>

                    <button
                        type="button"
                        className="cart-clear-button"
                        onClick={clearCart}
                    >
                        Clear cart
                    </button>
                </div>

                <div className="cart-layout">
                    <section className="cart-items">
                        {items.map((item) => (
                            <article
                                key={item.product.id}
                                className="cart-item"
                            >
                                <div className="cart-item-image">
                                    {item.product.image_url ? (
                                        <img
                                            src={item.product.image_url}
                                            alt={item.product.name}
                                        />
                                    ) : (
                                        <span>No image</span>
                                    )}
                                </div>

                                <div className="cart-item-details">
                                    <span className="cart-item-category">
                                        {item.product.category}
                                    </span>

                                    <h2>
                                        {item.product.name}
                                    </h2>

                                    <p>
                                        {item.product.description}
                                    </p>

                                    <button
                                        type="button"
                                        className="cart-remove-button"
                                        onClick={() =>
                                            removeFromCart(
                                                item.product.id,
                                            )
                                        }
                                    >
                                        Remove
                                    </button>
                                </div>

                                <div className="cart-item-actions">
                                    <strong>
                                        ₹
                                        {item.product.price.toLocaleString(
                                            'en-IN',
                                        )}
                                    </strong>

                                    <div className="quantity-control">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateQuantity(
                                                    item.product.id,
                                                    item.quantity - 1,
                                                )
                                            }
                                            aria-label={`Decrease quantity of ${item.product.name}`}
                                        >
                                            −
                                        </button>

                                        <span>
                                            {item.quantity}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateQuantity(
                                                    item.product.id,
                                                    item.quantity + 1,
                                                )
                                            }
                                            aria-label={`Increase quantity of ${item.product.name}`}
                                        >
                                            +
                                        </button>
                                    </div>

                                    <strong>
                                        ₹
                                        {(
                                            item.product.price *
                                            item.quantity
                                        ).toLocaleString('en-IN')}
                                    </strong>
                                </div>
                            </article>
                        ))}
                    </section>

                    <aside className="cart-summary">
                        <span className="cart-summary-label">
                            Order summary
                        </span>

                        <h2>Cart total</h2>

                        <div className="cart-summary-row">
                            <span>Subtotal</span>

                            <strong>
                                ₹
                                {subtotal.toLocaleString(
                                    'en-IN',
                                )}
                            </strong>
                        </div>

                        <div className="cart-summary-row">
                            <span>Delivery</span>

                            <span>Free</span>
                        </div>

                        <div className="cart-summary-divider" />

                        <div className="cart-summary-total">
                            <span>Total</span>

                            <strong>
                                ₹
                                {subtotal.toLocaleString(
                                    'en-IN',
                                )}
                            </strong>
                        </div>

                        <button
                            type="button"
                            className="checkout-button"
                            onClick={() => navigate('/checkout')}
                        >
                            Proceed to checkout
                        </button>
                    </aside>
                </div>
            </div>
        </main>
    )
}

export default CartPage