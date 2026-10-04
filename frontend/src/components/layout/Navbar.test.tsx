import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react'

import { MemoryRouter } from 'react-router-dom'

import { vi } from 'vitest'

import Navbar from './Navbar'


vi.mock('../../context/CartContext', () => ({
  useCart: () => ({
    itemCount: 2,
  }),
}))


vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}))


vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}))


describe('Navbar', () => {
  it('renders the product search bar', () => {
    render(
      <MemoryRouter>
        <Navbar
          search=""
          onSearchChange={() => {}}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('searchbox', {
        name: 'Search products',
      }),
    ).toBeInTheDocument()
  })


  it('calls onSearchChange when the user searches', () => {
    const onSearchChange = vi.fn()

    render(
      <MemoryRouter>
        <Navbar
          search=""
          onSearchChange={onSearchChange}
        />
      </MemoryRouter>,
    )

    const searchInput = screen.getByRole(
      'searchbox',
      {
        name: 'Search products',
      },
    )

    fireEvent.change(searchInput, {
      target: {
        value: 'laptop',
      },
    })

    expect(onSearchChange).toHaveBeenCalledWith(
      'laptop',
    )
  })


  it('clears the search when the clear button is clicked', () => {
    const onSearchChange = vi.fn()

    render(
      <MemoryRouter>
        <Navbar
          search="laptop"
          onSearchChange={onSearchChange}
        />
      </MemoryRouter>,
    )

    const clearButton = screen.getByRole(
      'button',
      {
        name: 'Clear search',
      },
    )

    fireEvent.click(clearButton)

    expect(onSearchChange).toHaveBeenCalledWith('')
  })


  it('shows the cart item count', () => {
    render(
      <MemoryRouter>
        <Navbar
          search=""
          onSearchChange={() => {}}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('2'),
    ).toBeInTheDocument()
  })
})