import { Link, useParams } from 'react-router-dom'

import { useProduct } from '../hooks/useProduct'

import { useCart } from '../context/CartContext'

import { useWishlist } from '../context/WishlistContext'

import './ProductDetailsPage.css'

function ProductDetailsPage() {
  const { productId } = useParams()

  const parsedProductId = Number(productId)
  

  const {
    product,
    loading,
    error,
  } = useProduct(parsedProductId)

  const { addToCart } = useCart()
  const {
  isWishlisted,
  toggleWishlist,
} = useWishlist()
const wishlisted = product
  ? isWishlisted(product.id)
  : false

  if (loading) {
    return (
      <main className="product-details-page">
        <div className="product-details-state">
          <div className="product-details-loading">
            Loading product...
          </div>
        </div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="product-details-page">
        <div className="product-details-state">
          <h1>Product unavailable</h1>

          <p>
            {error ??
              'We could not find this product.'}
          </p>

          <Link
            to="/"
            className="product-back-link"
          >
            ← Back to products
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="product-details-page">
      <div className="product-details-container">
        <Link
          to="/"
          className="product-back-link"
        >
          ← Back to products
        </Link>

        <div className="product-details">
          <div className="product-details-image">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
              />
            ) : (
              <div className="product-image-placeholder">
                No image available
              </div>
            )}
          </div>

          <div className="product-details-content">
            <span className="product-details-category">
              {product.category}
            </span>

            <h1>{product.name}</h1>

            <p className="product-details-description">
              {product.description}
            </p>

            <div className="product-details-price">
              ₹
              {product.price.toLocaleString(
                'en-IN',
              )}
            </div>

            <div className="product-details-divider" />

            <div className="product-details-actions">
              <button
                type="button"
                className="product-add-to-cart"
                onClick={() => addToCart(product)}
              >
                Add to cart
              </button>

              <button
  type="button"
  className={`product-add-to-wishlist ${
    wishlisted ? 'active' : ''
  }`}
  aria-label={
    wishlisted
      ? `Remove ${product.name} from wishlist`
      : `Add ${product.name} to wishlist`
  }
  aria-pressed={wishlisted}
  onClick={() => void toggleWishlist(product.id)}
>
  <span aria-hidden="true">
    {wishlisted ? '♥' : '♡'}
  </span>

  <span>
    {wishlisted
      ? 'Remove from wishlist'
      : 'Add to wishlist'}
  </span>
</button>
            </div>

            <div className="product-details-meta">
              <div>
                <strong>Free delivery</strong>
                <span>
                  Available for this product
                </span>
              </div>

              <div>
                <strong>Secure checkout</strong>
                <span>
                  Safe and protected payment
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ProductDetailsPage