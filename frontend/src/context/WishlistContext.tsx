import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  type WishlistItem,
} from '../services/wishlistService'

interface WishlistContextValue {
  items: WishlistItem[]
  itemCount: number
  isLoading: boolean
  error: string | null
  isWishlisted: (productId: number) => boolean
  addItem: (productId: number) => Promise<void>
  removeItem: (productId: number) => Promise<void>
  toggleWishlist: (productId: number) => Promise<void>
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<
  WishlistContextValue | undefined
>(undefined)

interface WishlistProviderProps {
  children: ReactNode
}

const TOKEN_KEY = 'smartcart-access-token'

export function WishlistProvider({
  children,
}: WishlistProviderProps) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refreshWishlist() {
    const token = localStorage.getItem(TOKEN_KEY)

    if (!token) {
      setItems([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const wishlist = await getWishlist()
      setItems(wishlist)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load wishlist.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshWishlist()
  }, [])

  async function addItem(productId: number) {
    setError(null)

    try {
      const wishlistItem = await addToWishlist(productId)

      setItems((currentItems) => {
        const alreadyExists = currentItems.some(
          (item) => item.product_id === productId,
        )

        if (alreadyExists) {
          return currentItems
        }

        return [wishlistItem, ...currentItems]
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to add product to wishlist.'

      setError(message)
      throw err
    }
  }

  async function removeItem(productId: number) {
    setError(null)

    try {
      await removeFromWishlist(productId)

      setItems((currentItems) =>
        currentItems.filter(
          (item) => item.product_id !== productId,
        ),
      )
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to remove product from wishlist.'

      setError(message)
      throw err
    }
  }

  async function toggleWishlist(productId: number) {
    if (isWishlisted(productId)) {
      await removeItem(productId)
    } else {
      await addItem(productId)
    }
  }

  function isWishlisted(productId: number) {
    return items.some(
      (item) => item.product_id === productId,
    )
  }

  const itemCount = useMemo(
    () => items.length,
    [items],
  )

  const value: WishlistContextValue = {
    items,
    itemCount,
    isLoading,
    error,
    isWishlisted,
    addItem,
    removeItem,
    toggleWishlist,
    refreshWishlist,
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)

  if (!context) {
    throw new Error(
      'useWishlist must be used inside WishlistProvider',
    )
  }

  return context
}