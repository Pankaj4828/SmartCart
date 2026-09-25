import {
  useEffect,
  useState,
} from 'react'

import {
  getProduct,
} from '../services/productService'

import type { Product } from '../types/product'

interface UseProductResult {
  product: Product | null
  loading: boolean
  error: string | null
}

export function useProduct(
  productId: number,
): UseProductResult {
  const [product, setProduct] =
    useState<Product | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      try {
        setLoading(true)
        setError(null)

        const data =
          await getProduct(productId)

        if (!cancelled) {
          setProduct(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load product',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadProduct()

    return () => {
      cancelled = true
    }
  }, [productId])

  return {
    product,
    loading,
    error,
  }
}