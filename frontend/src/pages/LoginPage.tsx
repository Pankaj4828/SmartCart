import {
  useState,
  type SubmitEvent,
} from 'react'

import {
  Link,
  useNavigate,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

import './LoginPage.css'

function LoginPage() {
  const navigate = useNavigate()

  const {
    login,
  } = useAuth()

  const [email, setEmail] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [error, setError] =
    useState('')

  const [processing, setProcessing] =
    useState(false)

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setProcessing(true)

    try {
      await login({
        email,
        password,
      })

      navigate('/')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to log in. Please try again.',
      )
    } finally {
      setProcessing(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-eyebrow">
            Welcome back
          </span>

          <h1>Sign in to SmartCart</h1>

          <p>
            Access your account, orders,
            and personalized shopping
            experience.
          </p>
        </div>

        {error && (
          <div
            className="auth-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={processing}
          >
            {processing
              ? 'Signing in...'
              : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}

          <Link to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}

export default LoginPage