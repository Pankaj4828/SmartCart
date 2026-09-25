import type {
  Product,
  ProductListResponse,
} from '../types/product'

const API_BASE_URL = 'http://127.0.0.1:8000'

export interface ProductFilters {
  search?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  page?: number
  limit?: number
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<ProductListResponse> {
  const params = new URLSearchParams()

  if (filters.search) {
    params.set('search', filters.search)
  }

  if (filters.category) {
    params.set('category', filters.category)
  }

  if (filters.minPrice !== undefined) {
    params.set(
      'min_price',
      filters.minPrice.toString(),
    )
  }

  if (filters.maxPrice !== undefined) {
    params.set(
      'max_price',
      filters.maxPrice.toString(),
    )
  }

  if (filters.sort) {
    params.set('sort', filters.sort)
  }

  params.set(
    'page',
    (filters.page ?? 1).toString(),
  )

  params.set(
    'limit',
    (filters.limit ?? 12).toString(),
  )

  const response = await fetch(
    `${API_BASE_URL}/products?${params.toString()}`,
  )

  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }

  return response.json()
}

export async function getProduct(
  productId: number,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/products/${productId}`,
  )

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Product not found')
    }

    throw new Error(
      'Failed to fetch product',
    )
  }

  return response.json()
}