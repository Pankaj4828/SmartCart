interface CatalogToolbarProps {
  category: string
  sort: string
  onCategoryChange: (value: string) => void
  onSortChange: (value: string) => void
  onClearFilters: () => void
}

const categories = [
  'All',
  'Computers',
  'Audio',
  'Wearables',
  'Accessories',
]

function CatalogToolbar({
  category,
  sort,
  onCategoryChange,
  onSortChange,
  onClearFilters,
}: CatalogToolbarProps) {
  const hasFilters =
    category !== 'All' || sort !== ''

  return (
    <div className="catalog-toolbar">
      <div className="category-list">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={
              category === item
                ? 'category-button active'
                : 'category-button'
            }
            onClick={() =>
              onCategoryChange(item)
            }
          >
            {item}
          </button>
        ))}
      </div>

      <div className="catalog-controls">
        <span className="sort-label">
          Sort by
        </span>

        <select
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value)
          }
          aria-label="Sort products"
        >
          <option value="">Recommended</option>

          <option value="price_asc">
            Price: Low to High
          </option>

          <option value="price_desc">
            Price: High to Low
          </option>

          <option value="name_asc">
            Name: A to Z
          </option>

          <option value="name_desc">
            Name: Z to A
          </option>
        </select>

        {hasFilters && (
          <button
            type="button"
            className="clear-filters-button"
            onClick={onClearFilters}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export default CatalogToolbar