'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'admin-theme-mode'

interface ThemeContextType {
  isDark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark') {
      setIsDark(true)
      document.querySelector('.admin-theme')?.classList.add('dark')
    }
  }, [])

  const toggle = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)

    const adminTheme = document.querySelector('.admin-theme')
    if (adminTheme) {
      if (newIsDark) {
        adminTheme.classList.add('dark')
        localStorage.setItem(STORAGE_KEY, 'dark')
      } else {
        adminTheme.classList.remove('dark')
        localStorage.setItem(STORAGE_KEY, 'light')
      }
    }
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Return default values if used outside provider
    return {
      isDark: false,
      toggle: () => {},
    }
  }
  return context
}

export function AdminThemeToggle() {
  const { isDark, toggle } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}
