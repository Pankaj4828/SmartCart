function ProductSkeleton() {
  return (
    <article className="product-card skeleton-card">
      <div className="product-image skeleton" />

      <div className="product-info">
        <div className="skeleton skeleton-category" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-description" />
        <div className="skeleton skeleton-button" />
      </div>
    </article>
  )
}

export default ProductSkeleton