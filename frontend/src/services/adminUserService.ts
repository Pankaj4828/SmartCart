import type {
  User,
} from './authService'

const API_BASE_URL =
  'http://127.0.0.1:8000'

const TOKEN_KEY =
  'smartcart-access-token'

function getAuthHeaders(): Record<string, string> {
  const token =
    localStorage.getItem(
      TOKEN_KEY,
    )

  if (!token) {
    throw new Error(
      'You must be logged in to manage users.',
    )
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

export async function getAdminUsers(): Promise<
  User[]
> {
  const response = await fetch(
    `${API_BASE_URL}/admin/users`,
    {
      headers: getAuthHeaders(),
    },
  )

  if (!response.ok) {
    let message =
      'Failed to fetch users'

    try {
      const errorData =
        await response.json()

      if (errorData.detail) {
        message = errorData.detail
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message)
  }

  return response.json()
}