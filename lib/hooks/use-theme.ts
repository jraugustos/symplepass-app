'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ThemeOption } from '@/types'

const STORAGE_KEY = 'symplepass-theme'

type ResolvedTheme = 'light' | 'dark'

export function useTheme(defaultTheme: ThemeOption = 'system') {
  const [theme, setThemeState] = useState<ThemeOption>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  const applyTheme = useCallback(
    (value: ThemeOption) => {
      if (typeof window === 'undefined') return

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const nextTheme: ResolvedTheme =
        value === 'system' ? (prefersDark ? 'dark' : 'light') : value

      const root = window.document.documentElement

      if (nextTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }

      setResolvedTheme(nextTheme)
    },
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedTheme = window.localStorage.getItem(STORAGE_KEY) as ThemeOption | null
    if (storedTheme) {
      setThemeState(storedTheme)
      applyTheme(storedTheme)
    } else {
      applyTheme(defaultTheme)
    }
  }, [applyTheme, defaultTheme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [applyTheme, theme])

  const setTheme = useCallback(
    (value: ThemeOption) => {
      setThemeState(value)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, value)
      }
      applyTheme(value)
    },
    [applyTheme]
  )

  return { theme, setTheme, resolvedTheme }
}
