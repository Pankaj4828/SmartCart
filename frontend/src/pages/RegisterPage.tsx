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

function RegisterPage() {
  const navigate = useNavigate()

  const {
    register,
  } = useAuth()

  const [name, setName] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [mobileNumber, setMobileNumber] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [confirmPassword, setConfirmPassword] =
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

    if (password !== confirmPassword) {
      setError(
        'Passwords do not match',
      )
      return
    }

    setProcessing(true)

    try {
      await register({
        name,
        email,
        mobile_number: mobileNumber,
        password,
      })

      navigate('/')
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to create your account. Please try again.',
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
            Get started
          </span>

          <h1>
            Create your SmartCart account
          </h1>

          <p>
            Create an account to manage
            your orders and shopping
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
            Full name

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              placeholder="Pankaj Behera"
              autoComplete="name"
              minLength={2}
              required
            />
          </label>

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
            Mobile number

            <input
              type="tel"
              value={mobileNumber}
              onChange={(event) =>
                setMobileNumber(
                  event.target.value,
                )
              }
              placeholder="9876543210"
              autoComplete="tel"
              minLength={10}
              maxLength={20}
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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label>
            Confirm password

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              placeholder="Re-enter your password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={processing}
          >
            {processing
              ? 'Creating account...'
              : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}

          <Link to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

export default RegisterPage