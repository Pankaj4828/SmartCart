import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  getCurrentUser,
  loginUser,
  registerUser,
  type LoginData,
  type RegisterData,
  type User,
} from '../services/authService'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (
    data: LoginData,
  ) => Promise<void>
  register: (
    data: RegisterData,
  ) => Promise<void>
  logout: () => void
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined,
  )

const TOKEN_KEY = 'smartcart-access-token'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<User | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  useEffect(() => {
    const token =
      localStorage.getItem(TOKEN_KEY)

    if (!token) {
      setIsLoading(false)
      return
    }

    getCurrentUser(token)
      .then((currentUser) => {
        setUser(currentUser)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  async function login(
    data: LoginData,
  ): Promise<void> {
    const tokenResponse =
      await loginUser(data)

    localStorage.setItem(
      TOKEN_KEY,
      tokenResponse.access_token,
    )

    const currentUser =
      await getCurrentUser(
        tokenResponse.access_token,
      )

    setUser(currentUser)
  }

  async function register(
    data: RegisterData,
  ): Promise<void> {
    await registerUser(data)

    await login({
      email: data.email,
      password: data.password,
    })
  }

  function logout(): void {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    )
  }

  return context
}