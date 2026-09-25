import { useMemo, useState } from 'react'

import CatalogToolbar from './CatalogToolbar'
import Pagination from './Pagination'
import ProductCard from './ProductCard'
import ProductSkeleton from './ProductSkeleton'

import { useProducts } from '../../hooks/useProducts'
import { useDebounce } from '../../hooks/useDebounce'

interface ProductSectionProps {
  search: string
  onSearchChange: (value: string) => void
}

function ProductSection({
  search,
  onSearchChange,
}: ProductSectionProps) {
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebounce(
    search,
    350,
  )

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      category:
        category === 'All'
          ? undefined
          : category,
      sort: sort || undefined,
      page,
      limit: 12,
    }),
    [
      debouncedSearch,
      category,
      sort,
      page,
    ],
  )

  const {
    products,
    total,
    totalPages,
    loading,
    error,
  } = useProducts(filters)

  function handleCategoryChange(
    value: string,
  ) {
    setCategory(value)
    setPage(1)
  }

  function handleSortChange(value: string) {
    setSort(value)
    setPage(1)
  }

  function handleClearFilters() {
    onSearchChange('')
    setCategory('All')
    setSort('')
    setPage(1)
  }

  return (
    <section
      className="products-section"
      id="products"
    >
      <div className="catalog-header">
        <div>
          <span className="section-label">
            Discover
          </span>

          <h2>Shop all products</h2>

          {!loading && (
            <p className="catalog-result-count">
              {total} products
            </p>
          )}
        </div>
      </div>

      <CatalogToolbar
        category={category}
        sort={sort}
        onCategoryChange={
          handleCategoryChange
        }
        onSortChange={handleSortChange}
        onClearFilters={
          handleClearFilters
        }
      />

      {loading && (
        <div className="product-grid">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <ProductSkeleton
                key={index}
              />
            ),
          )}
        </div>
      )}

      {!loading && error && (
        <div className="catalog-state error-state">
          <div className="state-icon">
            !
          </div>

          <h3>
            Something went wrong
          </h3>

          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        products.length === 0 && (
          <div className="catalog-state">
            <div className="state-icon">
              ⌕
            </div>

            <h3>
              No products found
            </h3>

            <p>
              Try changing your search or
              filters.
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={handleClearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

      {!loading &&
        !error &&
        products.length > 0 && (
          <>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
    </section>
  )
}

export default ProductSection