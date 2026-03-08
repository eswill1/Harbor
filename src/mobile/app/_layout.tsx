import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInterFonts,
} from '@expo-google-fonts/inter'
import {
  Lora_400Regular,
  Lora_700Bold,
  useFonts as useLoraFonts,
} from '@expo-google-fonts/lora'

import { queryClient } from '../lib/queryClient'
import { authApi } from '../lib/api'
import { useAuthStore } from '../store/auth'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { loadRefreshToken, setAuth, isLoading } = useAuthStore()

  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  })

  const [loraLoaded] = useLoraFonts({
    Lora_400Regular,
    Lora_700Bold,
  })

  const fontsLoaded = interLoaded && loraLoaded

  // On mount: check for stored refresh token and silently re-auth
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const refreshToken = await loadRefreshToken()

        if (refreshToken) {
          const result = await authApi.refresh(refreshToken)
          // We don't have user info from a refresh — navigate to app
          // and let the profile route fetch it. For now store minimal state.
          useAuthStore.setState({
            accessToken: result.access_token,
            isLoading:   false,
          })
          await authApi
            .refresh(result.refresh_token)
            .then(() => {})
            .catch(() => {})
        }
      } catch {
        // Refresh failed — send to login
        useAuthStore.setState({ isLoading: false })
      }
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, isLoading])

  if (!fontsLoaded || isLoading) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </QueryClientProvider>
  )
}
