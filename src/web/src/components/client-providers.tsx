'use client'

import { Providers } from './providers'

// Thin wrapper so the root layout (server component) can import a client
// component that owns the full provider tree.
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
