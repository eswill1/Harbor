import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'

export type ThemePreference = 'system' | 'light' | 'dark'

const secureStorage = {
  getItem:    (name: string) => SecureStore.getItemAsync(name),
  setItem:    (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
}

interface ThemeState {
  preference:    ThemePreference
  setPreference: (p: ThemePreference) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference:    'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name:    'harbor-theme-pref',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
)
