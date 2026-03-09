'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/auth'
import { SideNav } from '../../components/nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isHydrated } = useAuthStore()

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/login')
    }
  }, [isHydrated, user, router])

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <SideNav />
      {/* Content area — offset for sidebar on desktop, bottom bar on mobile */}
      <main className="md:ml-60 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
