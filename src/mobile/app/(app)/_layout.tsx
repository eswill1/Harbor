import { useEffect } from 'react'
import { Tabs, router } from 'expo-router'
import { useAuthStore } from '../../store/auth'
import { colors } from '../../constants/tokens'
import {
  Anchor,
  BookmarksSimple,
  UsersThree,
  PencilLine,
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
          title: 'Following',
          tabBarIcon: ({ color, size }) => (
            <UsersThree size={size} color={color} weight="regular" />
          ),
        }}
      />
      <Tabs.Screen
        name="compose"
        options={{
          title: 'Write',
          tabBarIcon: ({ color, size }) => (
            <PencilLine size={size} color={color} weight="regular" />
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
      {/* Deck is navigated to programmatically — hidden from tab bar */}
      <Tabs.Screen
        name="deck"
        options={{ href: null }}
      />
      {/* User profile — navigated to from deck card creator press */}
      <Tabs.Screen
        name="user/[id]"
        options={{ href: null }}
      />
      {/* Shelf detail — navigated to from shelves list */}
      <Tabs.Screen
        name="shelf/[id]"
        options={{ href: null }}
      />
      {/* Notices list — navigated to from profile */}
      <Tabs.Screen
        name="notices"
        options={{ href: null }}
      />
      {/* Notice detail — navigated to from notices list */}
      <Tabs.Screen
        name="notice/[id]"
        options={{ href: null }}
      />
      {/* Appeal form — navigated to from notice detail */}
      <Tabs.Screen
        name="notice/[id]/appeal"
        options={{ href: null }}
      />
    </Tabs>
  )
}
