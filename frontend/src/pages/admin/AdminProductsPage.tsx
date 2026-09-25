import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  activateAdminProduct,
  createAdminProduct,
  deactivateAdminProduct,
  getAdminProducts,
  updateAdminProduct,
} from '../../services/adminProductService'

import type {
  Product,
  ProductCreate,
} from '../../types/product'

import './AdminProductsPage.css'

const emptyForm: ProductCreate = {
  name: '',
  category: '',
  price: 0,
  description: '',
  image_url: null,
}

function AdminProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([])

  const [form, setForm] =
    useState<ProductCreate>(emptyForm)

  const [editingProductId, setEditingProductId] =
    useState<number | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSaving, setIsSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  async function loadProducts() {
    try {
      setIsLoading(true)
      setError('')

      const data =
        await getAdminProducts()

      setProducts(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load products',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  function handleInputChange(
    field: keyof ProductCreate,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]:
        field === 'price'
          ? Number(value)
          : value,
    }))
  }

  function startEditing(
    product: Product,
  ) {
    setEditingProductId(product.id)

    setForm({
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description,
      image_url: product.image_url,
    })
  }

  function resetForm() {
    setEditingProductId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setError('')

      if (editingProductId !== null) {
        const updated =
          await updateAdminProduct(
            editingProductId,
            form,
          )

        setProducts((current) =>
          current.map((product) =>
            product.id === updated.id
              ? updated
              : product,
          ),
        )
      } else {
        const created =
          await createAdminProduct(form)

        setProducts((current) => [
          ...current,
          created,
        ])
      }

      resetForm()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save product',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleStatus(
    product: Product,
  ) {
    try {
      setError('')

      const updated =
        product.is_active
          ? await deactivateAdminProduct(
              product.id,
            )
          : await activateAdminProduct(
              product.id,
            )

      setProducts((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update product status',
      )
    }
  }

  return (
    <main className="admin-products-page">
      <section className="admin-products-header">
        <div>
          <span className="admin-eyebrow">
            ADMIN
          </span>

          <h1>
            Product Management
          </h1>

          <p>
            Create, update, and manage
            product availability.
          </p>
        </div>
      </section>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <section className="admin-product-form-section">
        <div className="admin-section-heading">
          <div>
            <h2>
              {editingProductId !== null
                ? 'Edit Product'
                : 'Add Product'}
            </h2>

            <p>
              {editingProductId !== null
                ? 'Update the selected product.'
                : 'Create a new product for the catalog.'}
            </p>
          </div>
        </div>

        <form
          className="admin-product-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-form-grid">
            <label>
              Name
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  handleInputChange(
                    'name',
                    event.target.value,
                  )
                }
                required
              />
            </label>

            <label>
              Category
              <input
                type="text"
                value={form.category}
                onChange={(event) =>
                  handleInputChange(
                    'category',
                    event.target.value,
                  )
                }
                required
              />
            </label>

            <label>
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) =>
                  handleInputChange(
                    'price',
                    event.target.value,
                  )
                }
                required
              />
            </label>

            <label>
              Image URL
              <input
                type="url"
                value={form.image_url ?? ''}
                onChange={(event) =>
                  handleInputChange(
                    'image_url',
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="admin-form-full">
              Description
              <textarea
                value={form.description}
                onChange={(event) =>
                  handleInputChange(
                    'description',
                    event.target.value,
                  )
                }
                rows={4}
                required
              />
            </label>
          </div>

          <div className="admin-form-actions">
            <button
              type="submit"
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving...'
                : editingProductId !== null
                  ? 'Update Product'
                  : 'Create Product'}
            </button>

            {editingProductId !== null && (
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-product-list-section">
        <div className="admin-section-heading">
          <div>
            <h2>
              Products
            </h2>

            <p>
              {products.length} products
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-empty-state">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="admin-empty-state">
            No products found.
          </div>
        ) : (
          <div className="admin-product-table-wrapper">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      #{product.id}
                    </td>

                    <td>
                      <div className="admin-product-name">
                        {product.name}
                      </div>
                    </td>

                    <td>
                      {product.category}
                    </td>

                    <td>
                      ₹{product.price.toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={
                          product.is_active
                            ? 'admin-status active'
                            : 'admin-status inactive'
                        }
                      >
                        {product.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>

                    <td>
                      <div className="admin-product-actions">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(product)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className={
                            product.is_active
                              ? 'danger'
                              : 'success'
                          }
                          onClick={() =>
                            void handleToggleStatus(
                              product,
                            )
                          }
                        >
                          {product.is_active
                            ? 'Deactivate'
                            : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminProductsPage