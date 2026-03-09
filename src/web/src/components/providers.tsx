'use client'

import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useThemeStore } from '../store/theme'
import { useAuthStore } from '../store/auth'
import { authApi } from '../lib/api'

// Created at module level so it survives re-renders and is available immediately.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function ThemeController({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else if (mode === 'light') {
      root.removeAttribute('data-theme')
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const apply = (dark: boolean) => {
        if (dark) root.setAttribute('data-theme', 'dark')
        else root.removeAttribute('data-theme')
      }
      apply(mq.matches)
      mq.addEventListener('change', (e) => apply(e.matches))
      return () => mq.removeEventListener('change', (e) => apply(e.matches))
    }
  }, [mode])

  return <>{children}</>
}

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { refreshToken, setTokens, clearAuth, setHydrated } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!refreshToken) {
      setHydrated()
      setReady(true)
      return
    }

    authApi.refresh(refreshToken)
      .then(({ access_token, refresh_token }) => {
        setTokens(access_token, refresh_token)
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => {
        setHydrated()
        setReady(true)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
             style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return <>{children}</>
}

// QueryClientProvider is rendered unconditionally so useMutation/useQuery hooks
// are always available — even before the localStorage-dependent auth bootstrap runs.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeController>
        <AuthBootstrap>
          {children}
        </AuthBootstrap>
      </ThemeController>
    </QueryClientProvider>
  )
}
