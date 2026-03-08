import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { router } from 'expo-router'
import { useAuthStore } from '../../store/auth'

export default function AuthLayout() {
  const accessToken = useAuthStore((s) => s.accessToken)

  // If already authenticated, redirect to main app
  useEffect(() => {
    if (accessToken) {
      router.replace('/(app)')
    }
  }, [accessToken])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}
