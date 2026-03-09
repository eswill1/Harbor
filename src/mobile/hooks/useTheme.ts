import { useColorScheme } from 'react-native'
import { colors } from '../constants/tokens'
import { useThemeStore } from '../store/theme'

function resolveIsDark(preference: string, scheme: string | null | undefined): boolean {
  if (preference === 'dark')  return true
  if (preference === 'light') return false
  return scheme === 'dark'
}

export function useTheme() {
  const scheme     = useColorScheme()
  const preference = useThemeStore((s) => s.preference)
  return resolveIsDark(preference, scheme) ? colors.dark : colors.light
}

export function useIsDark(): boolean {
  const scheme     = useColorScheme()
  const preference = useThemeStore((s) => s.preference)
  return resolveIsDark(preference, scheme)
}
