'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id:           string
  handle:       string
  display_name: string
}

interface AuthState {
  user:          AuthUser | null
  accessToken:   string | null
  refreshToken:  string | null
  isHydrated:    boolean

  setAuth:       (user: AuthUser, accessToken: string, refreshToken: string) => void
  setTokens:     (accessToken: string, refreshToken: string) => void
  clearAuth:     () => void
  setHydrated:   () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isHydrated:   false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null }),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name:    'harbor_auth',
      // Only persist tokens + user; isHydrated is runtime-only
      partialize: (s) => ({
        user:         s.user,
        accessToken:  s.accessToken,
        refreshToken: s.refreshToken,
      }),
    },
  ),
)
