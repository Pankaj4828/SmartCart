const API_BASE_URL = 'http://127.0.0.1:8000'

export interface User {
  id: number
  name: string
  email: string
  mobile_number: string
  role: string
  is_active: boolean
  created_at: string
}

export interface RegisterData {
  name: string
  email: string
  mobile_number: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export async function registerUser(
  data: RegisterData,
): Promise<User> {
  const response = await fetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  )

  if (!response.ok) {
    let message = 'Registration failed'

    try {
      const error = await response.json()

      if (error.detail) {
        message = error.detail
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function loginUser(
  data: LoginData,
): Promise<TokenResponse> {
  const formData = new URLSearchParams()

  formData.set('username', data.email)
  formData.set('password', data.password)

  const response = await fetch(
    `${API_BASE_URL}/auth/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    },
  )

  if (!response.ok) {
    let message = 'Login failed'

    try {
      const error = await response.json()

      if (error.detail) {
        message = error.detail
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message)
  }

  return response.json()
}

export async function getCurrentUser(
  token: string,
): Promise<User> {
  const response = await fetch(
    `${API_BASE_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    let message = 'Failed to get current user'

    try {
      const error = await response.json()

      if (error.detail) {
        message = error.detail
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message)
  }

  return response.json()
}