import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react'

import CatalogToolbar from '../CatalogToolbar'


describe('CatalogToolbar', () => {
  it('renders all product categories', () => {
    render(
      <CatalogToolbar
        category="All"
        sort=""
        onCategoryChange={() => {}}
        onSortChange={() => {}}
        onClearFilters={() => {}}
      />,
    )

    expect(
      screen.getByRole('button', {
        name: 'All',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Computers',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Audio',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Wearables',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: 'Accessories',
      }),
    ).toBeInTheDocument()
  })


  it('calls onCategoryChange when a category is selected', () => {
    const onCategoryChange = vi.fn()

    render(
      <CatalogToolbar
        category="All"
        sort=""
        onCategoryChange={onCategoryChange}
        onSortChange={() => {}}
        onClearFilters={() => {}}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Computers',
      }),
    )

    expect(onCategoryChange).toHaveBeenCalledWith(
      'Computers',
    )
  })


  it('calls onSortChange when the sort option changes', () => {
    const onSortChange = vi.fn()

    render(
      <CatalogToolbar
        category="All"
        sort=""
        onCategoryChange={() => {}}
        onSortChange={onSortChange}
        onClearFilters={() => {}}
      />,
    )

    fireEvent.change(
      screen.getByRole('combobox', {
        name: 'Sort products',
      }),
      {
        target: {
          value: 'price_asc',
        },
      },
    )

    expect(onSortChange).toHaveBeenCalledWith(
      'price_asc',
    )
  })


  it('shows Clear when filters are active', () => {
    const onClearFilters = vi.fn()

    render(
      <CatalogToolbar
        category="Computers"
        sort=""
        onCategoryChange={() => {}}
        onSortChange={() => {}}
        onClearFilters={onClearFilters}
      />,
    )

    const clearButton = screen.getByRole(
      'button',
      {
        name: 'Clear',
      },
    )

    expect(clearButton).toBeInTheDocument()

    fireEvent.click(clearButton)

    expect(onClearFilters).toHaveBeenCalledTimes(1)
  })
})
