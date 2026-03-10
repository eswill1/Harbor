import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { useAuthStore } from '../../store/auth'

export default function AppLayout() {
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!accessToken) {
      router.replace('/(auth)/login')
    }
  }, [accessToken])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="deck" />
      <Stack.Screen name="user/[id]" />
      <Stack.Screen name="shelf/[id]" />
      <Stack.Screen name="notices" />
      <Stack.Screen name="notice/[id]" />
      <Stack.Screen name="notice/[id]/appeal" />
    </Stack>
  )
}
