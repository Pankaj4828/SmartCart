import {
  useEffect,
  useState,
} from 'react'

import {
  getProducts,
  type ProductFilters,
} from '../services/productService'

import type {
  Product,
} from '../types/product'

interface UseProductsResult {
  products: Product[]
  total: number
  page: number
  totalPages: number
  loading: boolean
  error: string
}

export function useProducts(
  filters: ProductFilters,
): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true)
        setError('')

        const data = await getProducts(filters)

        setProducts(data.items)
        setTotal(data.total)
        setPage(data.page)
        setTotalPages(data.total_pages)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Failed to load products')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [filters])

  return {
    products,
    total,
    page,
    totalPages,
    loading,
    error,
  }
}