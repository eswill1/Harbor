import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { User, SignOut } from 'phosphor-react-native'
import { router } from 'expo-router'

import { authApi } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { colors, fontSize, fontFamily, space, radius } from '../../constants/tokens'

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user, accessToken, clearAuth } = useAuthStore()

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            const refreshToken = await import('expo-secure-store').then((m) =>
              m.getItemAsync('harbor_refresh_token'),
            )
            if (accessToken && refreshToken) {
              await authApi.logout(accessToken, refreshToken).catch(() => {})
            }
          } finally {
            await clearAuth()
            router.replace('/(auth)/login')
          }
        },
      },
    ])
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.avatar}>
        <User size={32} color={colors.light.accentPrimary} weight="regular" />
      </View>

      {user && (
        <>
          <Text style={styles.displayName}>{user.display_name}</Text>
          <Text style={styles.handle}>@{user.handle}</Text>
        </>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
        <SignOut size={18} color={colors.light.textSecondary} weight="regular" />
        <Text style={styles.signOutLabel}>Sign out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.light.bgBase,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             space[4],
  },
  avatar: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: colors.light.bgElevated,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    space[2],
  },
  displayName: {
    fontSize:     fontSize.lg,
    fontFamily:   fontFamily.interBold,
    color:        colors.light.textPrimary,
    letterSpacing: -0.3,
  },
  handle: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
  },
  signOutButton: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            space[2],
    paddingVertical:   space[3],
    paddingHorizontal: space[5],
    borderRadius:   radius.md,
    borderWidth:    1,
    borderColor:    colors.light.border,
    marginTop:      space[6],
  },
  signOutLabel: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textSecondary,
  },
})
