import { useEffect } from 'react'
import { Tabs, router } from 'expo-router'
import { useAuthStore } from '../../store/auth'
import { colors } from '../../constants/tokens'
import {
  Anchor,
  BookmarksSimple,
  Compass,
  User,
} from 'phosphor-react-native'

export default function AppLayout() {
  const accessToken = useAuthStore((s) => s.accessToken)

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!accessToken) {
      router.replace('/(auth)/login')
    }
  }, [accessToken])

  return (
    <Tabs
      screenOptions={{
        headerShown:      false,
        tabBarActiveTintColor:   colors.light.accentPrimary,
        tabBarInactiveTintColor: colors.light.textMuted,
        tabBarStyle: {
          backgroundColor: colors.light.bgSurface,
          borderTopColor:  colors.light.border,
          borderTopWidth:  1,
        },
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Anchor size={size} color={color} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="shelves"
        options={{
          title: 'Shelves',
          tabBarIcon: ({ color, size }) => (
            <BookmarksSimple size={size} color={color} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Compass size={size} color={color} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} weight="regular" />
          ),
        }}
      />
    </Tabs>
  )
}
