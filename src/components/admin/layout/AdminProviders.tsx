'use client'

import { ReactNode } from 'react'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import { ThemeProvider } from './AdminThemeToggle'

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </LanguageProvider>
  )
}
