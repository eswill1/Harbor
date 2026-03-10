import { Tabs } from 'expo-router'
import {
  Anchor,
  BookmarksSimple,
  UsersThree,
  PencilLine,
  User,
} from 'phosphor-react-native'
import { useTheme } from '../../../hooks/useTheme'

export default function TabsLayout() {
  const theme = useTheme()

  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarActiveTintColor:   theme.accentPrimary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.bgSurface,
          borderTopColor:  theme.border,
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
    </Tabs>
  )
}
