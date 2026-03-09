'use client'

import { useState, useEffect } from 'react'
import { Providers } from './providers'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Skip full provider tree during SSR / prerender; render children bare so
  // the static shell builds cleanly. All interactive pages are client-gated.
  if (!mounted) return <>{children}</>

  return <Providers>{children}</Providers>
}
