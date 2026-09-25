import { Link } from 'react-router-dom'

import type { Product } from '../../types/product'

import { useCart } from '../../context/CartContext'

import { useWishlist } from '../../context/WishlistContext'

import './ProductCard.css'


interface ProductCardProps {
  product: Product
}

function ProductCard({
  product,
}: ProductCardProps) {

  const {
    isWishlisted,
    toggleWishlist,
  } = useWishlist()

  const wishlisted = isWishlisted(product.id)
  const { addToCart } = useCart()

  return (
    <article className="product-card">
      <div className="product-image">
        <button
          type="button"
          className={`wishlist-button ${wishlisted ? 'active' : ''}`}
          aria-label={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={wishlisted}
          onClick={() => void toggleWishlist(product.id)}
        >
          {wishlisted ? '♥' : '♡'}
        </button>

        <Link
          to={`/products/${product.id}`}
          className="product-image-link"
          aria-label={`View ${product.name}`}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
            />
          ) : (
            <div className="image-placeholder">
              No image
            </div>
          )}
        </Link>
      </div>

      <div className="product-info">
        <Link
          to={`/products/${product.id}`}
          className="product-details-link"
        >
          <span className="product-category">
            {product.category}
          </span>

          <h3>{product.name}</h3>

          <p>{product.description}</p>
        </Link>

        <div className="product-footer">
          <strong>
            ₹
            {product.price.toLocaleString(
              'en-IN',
            )}
          </strong>

          <button
            type="button"
            className="add-button"
            onClick={() =>
              addToCart(product)
            }
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  )
}

export default ProductCard