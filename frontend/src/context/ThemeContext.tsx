import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext =
  createContext<
    ThemeContextValue | undefined
  >(undefined)

const THEME_KEY =
  'smartcart-theme'

interface ThemeProviderProps {
  children: ReactNode
}

function getInitialTheme(): Theme {
  const savedTheme =
    localStorage.getItem(THEME_KEY)

  if (
    savedTheme === 'light' ||
    savedTheme === 'dark'
  ) {
    return savedTheme
  }

  return 'light'
}

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [theme, setTheme] =
    useState<Theme>(
      getInitialTheme,
    )

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme

    localStorage.setItem(
      THEME_KEY,
      theme,
    )
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === 'light'
        ? 'dark'
        : 'light',
    )
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const context =
    useContext(ThemeContext)

  if (!context) {
    throw new Error(
      'useTheme must be used inside ThemeProvider',
    )
  }

  return context
}