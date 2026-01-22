'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, Translations } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'admin-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load language from localStorage on mount
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'lt')) {
      setLanguageState(savedLanguage)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }

  const t = translations[language]

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    // Return default values if used outside provider (for SSR)
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: translations.en,
    }
  }
  return context
}
