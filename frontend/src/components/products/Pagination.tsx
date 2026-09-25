interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <nav
      className="pagination"
      aria-label="Product pagination"
    >
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        ←
      </button>

      {Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      ).map((pageNumber) => (
        <button
          type="button"
          key={pageNumber}
          className={
            pageNumber === page
              ? 'page-button active'
              : 'page-button'
          }
          onClick={() =>
            onPageChange(pageNumber)
          }
          aria-current={
            pageNumber === page
              ? 'page'
              : undefined
          }
        >
          {pageNumber}
        </button>
      ))}

      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  )
}

export default Pagination