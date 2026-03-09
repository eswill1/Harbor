'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../store/auth'

export default function RootPage() {
  const router = useRouter()
  const { user, isHydrated } = useAuthStore()

  useEffect(() => {
    if (!isHydrated) return
    if (user) {
      router.replace('/home')
    } else {
      router.replace('/login')
    }
  }, [isHydrated, user, router])

  return null
}
