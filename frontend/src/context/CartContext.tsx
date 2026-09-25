import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { Product } from '../types/product'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number

  addToCart: (product: Product) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (
    productId: number,
    quantity: number,
  ) => void
  clearCart: () => void
}

const CartContext =
  createContext<CartContextValue | undefined>(
    undefined,
  )

const CART_STORAGE_KEY = 'smartcart-cart'

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({
  children,
}: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(
    () => {
      try {
        const storedCart =
          localStorage.getItem(
            CART_STORAGE_KEY,
          )

        if (!storedCart) {
          return []
        }

        return JSON.parse(
          storedCart,
        ) as CartItem[]
      } catch {
        return []
      }
    },
  )

  useEffect(() => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(items),
    )
  }, [items])

  function addToCart(product: Product) {
    setItems((currentItems) => {
      const existingItem =
        currentItems.find(
          (item) =>
            item.product.id === product.id,
        )

      if (existingItem) {
        return currentItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item,
        )
      }

      return [
        ...currentItems,
        {
          product,
          quantity: 1,
        },
      ]
    })
  }

  function removeFromCart(
    productId: number,
  ) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.product.id !== productId,
      ),
    )
  }

  function updateQuantity(
    productId: number,
    quantity: number,
  ) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    )
  }

  function clearCart() {
    setItems([])
  }

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      ),
    [items],
  )

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          item.product.price *
            item.quantity,
        0,
      ),
    [items],
  )

  const value = {
    items,
    itemCount,
    subtotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider',
    )
  }

  return context
}