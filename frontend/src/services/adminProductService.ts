import type {
  Product,
  ProductCreate,
} from '../types/product'

const API_BASE_URL = 'http://127.0.0.1:8000'

const TOKEN_KEY = 'smartcart-access-token'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY)

  if (!token) {
    throw new Error(
      'You must be logged in as an admin.',
    )
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function getAdminProducts(): Promise<Product[]> {
  const response = await fetch(
    `${API_BASE_URL}/admin/products`,
    {
      headers: getAuthHeaders(),
    },
  )

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Admin access required.')
    }

    throw new Error(
      'Failed to fetch admin products.',
    )
  }

  return response.json()
}

export async function createAdminProduct(
  product: ProductCreate,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/products`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(product),
    },
  )

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Admin access required.')
    }

    const data = await response.json().catch(() => null)

    throw new Error(
      data?.detail || 'Failed to create product.',
    )
  }

  return response.json()
}

export async function updateAdminProduct(
  productId: number,
  product: Partial<ProductCreate>,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/admin/products/${productId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(product),
    },
  )

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Admin access required.')
    }

    const data = await response.json().catch(() => null)

    throw new Error(
      data?.detail || 'Failed to update product.',
    )
  }

  return response.json()
}

export async function deactivateAdminProduct(
  productId: number,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/admin/products/${productId}/deactivate`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
    },
  )

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Admin access required.')
    }

    const data = await response.json().catch(() => null)

    throw new Error(
      data?.detail ||
        'Failed to deactivate product.',
    )
  }

  return response.json()
}

export async function activateAdminProduct(
  productId: number,
): Promise<Product> {
  const response = await fetch(
    `${API_BASE_URL}/admin/products/${productId}/activate`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(),
    },
  )

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Admin access required.')
    }

    const data = await response.json().catch(() => null)

    throw new Error(
      data?.detail ||
        'Failed to activate product.',
    )
  }

  return response.json()
}