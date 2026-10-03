import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // During local development, forward /api requests
  // from Vite to the local FastAPI backend.
  //
  // Example:
  // Browser → Vite /api/products → FastAPI /products
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',

        // Remove /api before sending the request
        // to FastAPI because our backend routes are
        // /products, /auth, /orders, etc.
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})