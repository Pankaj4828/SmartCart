import type { Product } from '../types/product'

export interface WishlistItem {
  id: number
  product_id: number
  product: Product
  created_at: string
}

const API_BASE_URL = 'http://127.0.0.1:8000'
const TOKEN_KEY = 'smartcart-access-token'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY)

  if (!token) {
    throw new Error('You must be logged in to manage your wishlist.')
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/wishlist`,
    {
      headers: getAuthHeaders(),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)

    throw new Error(
      data?.detail || 'Failed to load wishlist.',
    )
  }

  return response.json()
}

export async function addToWishlist(
  productId: number,
): Promise<WishlistItem> {
  const response = await fetch(
    `${API_BASE_URL}/wishlist/${productId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({}),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)

    throw new Error(
      data?.detail || 'Failed to add product to wishlist.',
    )
  }

  return response.json()
}

export async function removeFromWishlist(
  productId: number,
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/wishlist/${productId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    },
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null)

    throw new Error(
      data?.detail || 'Failed to remove product from wishlist.',
    )
  }
}