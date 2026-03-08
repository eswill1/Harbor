import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { useSessionStore } from './session'

const REFRESH_KEY = 'harbor_refresh_token'

export interface AuthUser {
  id:           string
  handle:       string
  display_name: string
}

interface AuthState {
  user:         AuthUser | null
  accessToken:  string | null
  isLoading:    boolean

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>
  clearAuth: () => Promise<void>
  setAccessToken: (token: string) => void
  loadRefreshToken: () => Promise<string | null>
}

export const useAuthStore = create<AuthState>((set) => ({
  user:        null,
  accessToken: null,
  isLoading:   true,

  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
    set({ user, accessToken, isLoading: false })
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(REFRESH_KEY)
    useSessionStore.getState().clearDeck()
    set({ user: null, accessToken: null, isLoading: false })
  },

  setAccessToken: (token) => set({ accessToken: token }),

  loadRefreshToken: async () => {
    const token = await SecureStore.getItemAsync(REFRESH_KEY)
    set({ isLoading: false })
    return token
  },
}))
