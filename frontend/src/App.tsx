import { useState } from 'react'

import {
  Routes,
  Route,
  useLocation,
} from 'react-router-dom'

import './App.css'

import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

import AdminLayout from './components/admin/AdminLayout'
import AdminRoute from './components/auth/AdminRoute'

import Hero from './components/home/Hero'
import AISection from './components/home/AISection'

import ProductSection from './components/products/ProductSection'

import ProductDetailsPage from './pages/ProductDetailsPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentPage from './pages/PaymentPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrdersPage from './pages/OrdersPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WishlistPage from './pages/WishlistPage'

import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'

function App() {
  const location = useLocation()

  const isAdminRoute =
    location.pathname.startsWith('/admin')

  const [search, setSearch] =
    useState('')

  const appRoutes = (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <main>
              <Hero />

              <ProductSection
                search={search}
                onSearchChange={
                  setSearch
                }
              />

              <AISection />
            </main>
          </>
        }
      />

      <Route
        path="/products/:productId"
        element={
          <ProductDetailsPage />
        }
      />

      <Route
        path="/cart"
        element={
          <CartPage />
        }
      />

      <Route
        path="/checkout"
        element={
          <CheckoutPage />
        }
      />

      <Route
        path="/checkout/payment"
        element={
          <PaymentPage />
        }
      />

      <Route
        path="/order-success"
        element={
          <OrderSuccessPage />
        }
      />

      <Route
        path="/orders"
        element={
          <OrdersPage />
        }
      />

      <Route
        path="/orders/:orderId"
        element={
          <OrderDetailsPage />
        }
      />

      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      <Route
        path="/register"
        element={
          <RegisterPage />
        }
      />

      <Route
        path="/wishlist"
        element={
          <WishlistPage />
        }
      />

      <Route
        element={
          <AdminRoute />
        }
      >
        <Route
          path="/admin"
          element={
            <AdminDashboardPage />
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminProductsPage />
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminOrdersPage />
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminUsersPage />
          }
        />
      </Route>
    </Routes>
  )

  return (
    <div className="app">
      {isAdminRoute ? (
        <AdminLayout>
          {appRoutes}
        </AdminLayout>
      ) : (
        <>
          <Navbar
            search={search}
            onSearchChange={
              setSearch
            }
          />

          {appRoutes}

          <Footer />
        </>
      )}
    </div>
  )
}

export default App
