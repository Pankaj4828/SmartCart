import { Link } from 'react-router-dom'

import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

import './WishlistPage.css'

function WishlistPage() {
  const {
    items,
    isLoading,
    error,
    removeItem,
  } = useWishlist()

  const { addToCart } = useCart()

  if (isLoading) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-container">
          <div className="wishlist-header">
            <span className="wishlist-eyebrow">
              YOUR SAVED PRODUCTS
            </span>

            <h1>Wishlist</h1>

            <p>
              Products you saved for later.
            </p>
          </div>

          <div className="wishlist-state">
            <p>Loading your wishlist...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="wishlist-page">
      <div className="wishlist-container">
        <header className="wishlist-header">
          <div>
            <span className="wishlist-eyebrow">
              YOUR SAVED PRODUCTS
            </span>

            <h1>Wishlist</h1>

            <p>
              {items.length === 0
                ? 'Save products you want to come back to.'
                : `${items.length} ${
                    items.length === 1
                      ? 'product'
                      : 'products'
                  } saved.`}
            </p>
          </div>
        </header>

        {error && (
          <div
            className="wishlist-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <section className="wishlist-empty">
            <div
              className="wishlist-empty-icon"
              aria-hidden="true"
            >
              ♡
            </div>

            <h2>Your wishlist is empty</h2>

            <p>
              Browse our products and save the ones
              you like.
            </p>

            <Link
              to="/"
              className="wishlist-browse-button"
            >
              Browse products
            </Link>
          </section>
        ) : (
          <section className="wishlist-grid">
            {items.map((item) => (
              <article
                key={item.id}
                className="wishlist-card"
              >
                <Link
                  to={`/products/${item.product.id}`}
                  className="wishlist-image-link"
                >
                  {item.product.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                    />
                  ) : (
                    <div className="wishlist-image-placeholder">
                      No image
                    </div>
                  )}
                </Link>

                <div className="wishlist-card-content">
                  <span className="wishlist-product-category">
                    {item.product.category}
                  </span>

                  <Link
                    to={`/products/${item.product.id}`}
                    className="wishlist-product-name"
                  >
                    {item.product.name}
                  </Link>

                  <p className="wishlist-product-description">
                    {item.product.description}
                  </p>

                  <strong className="wishlist-product-price">
                    ₹{item.product.price.toLocaleString('en-IN')}
                  </strong>

                  <div className="wishlist-card-actions">
                    <button
                      type="button"
                      className="wishlist-cart-button"
                      onClick={() =>
                        addToCart(item.product)
                      }
                    >
                      Add to cart
                    </button>

                    <button
                      type="button"
                      className="wishlist-remove-button"
                      onClick={() =>
                        void removeItem(item.product.id)
                      }
                    >
                      ♥ Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}

export default WishlistPage