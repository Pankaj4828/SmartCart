import {
  StrictMode,
} from 'react'

import {
  createRoot,
} from 'react-dom/client'

import {
  BrowserRouter,
} from 'react-router-dom'

import './index.css'

import App from './App'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import {
  ThemeProvider,
} from './context/ThemeContext'


createRoot(
  document.getElementById('root')!,
).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <AuthProvider>
          <WishlistProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </WishlistProvider>
        </AuthProvider>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
)
