import { useState, useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { User, SignOut, Bell, CaretRight, Moon } from 'phosphor-react-native'
import { router } from 'expo-router'

import { authApi, moderationApi } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { useThemeStore, type ThemePreference } from '../../store/theme'
import { colors, fontSize, fontFamily, space, radius } from '../../constants/tokens'
import { useTheme } from '../../hooks/useTheme'

const APPEARANCE_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light',  value: 'light'  },
  { label: 'Dark',   value: 'dark'   },
]

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user, accessToken, clearAuth } = useAuthStore()
  const { preference, setPreference } = useThemeStore()
  const theme  = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!accessToken) return
    moderationApi.getNotices(accessToken, 0)
      .then((notices) => {
        const count = notices.filter((n) => n.read_at === null).length
        setUnreadCount(count)
      })
      .catch(() => {
        // Non-critical — ignore silently
      })
  }, [accessToken])

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
        <User size={32} color={theme.accentPrimary} weight="regular" />
      </View>

      {user && (
        <>
          <Text style={styles.displayName}>{user.display_name}</Text>
          <Text style={styles.handle}>@{user.handle}</Text>
        </>
      )}

      {/* ── Nav rows ── */}
      <View style={styles.navSection}>
        <Pressable
          style={({ pressed }) => [styles.navRow, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/(app)/notices')}
        >
          <Bell size={20} color={theme.textSecondary} weight="regular" />
          <Text style={styles.navLabel}>{"Notices"}</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
            </View>
          )}
          <CaretRight size={16} color={theme.textMuted} weight="regular" style={styles.navChevron} />
        </Pressable>

        <View style={styles.navRowDivider} />

        {/* ── Appearance row ── */}
        <View style={styles.appearanceRow}>
          <Moon size={20} color={theme.textSecondary} weight="regular" />
          <Text style={styles.navLabel}>{"Appearance"}</Text>
          <View style={styles.segmentedControl}>
            {APPEARANCE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.segment,
                  preference === opt.value && styles.segmentActive,
                ]}
                onPress={() => setPreference(opt.value)}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    preference === opt.value && styles.segmentLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
        <SignOut size={18} color={theme.textSecondary} weight="regular" />
        <Text style={styles.signOutLabel}>Sign out</Text>
      </TouchableOpacity>
    </View>
  )
}

const makeStyles = (c: typeof colors.light) => StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: c.bgBase,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             space[4],
  },
  avatar: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: c.bgElevated,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    space[2],
  },
  displayName: {
    fontSize:     fontSize.lg,
    fontFamily:   fontFamily.interBold,
    color:        c.textPrimary,
    letterSpacing: -0.3,
  },
  handle: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
  },

  // Nav rows
  navSection: {
    width:             '100%',
    marginTop:         space[4],
    borderTopWidth:    1,
    borderTopColor:    c.border,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  navRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: space[5],
    paddingVertical:   space[4],
    gap:               space[3],
    backgroundColor:   c.bgBase,
  },
  navRowDivider: {
    height:          1,
    backgroundColor: c.border,
    marginHorizontal: space[5],
  },
  appearanceRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: space[5],
    paddingVertical:   space[3],
    gap:               space[3],
    backgroundColor:   c.bgBase,
  },
  navLabel: {
    flex:       1,
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      c.textPrimary,
  },
  navChevron: {
    marginLeft: 'auto',
  },
  badge: {
    minWidth:          20,
    height:            20,
    borderRadius:      10,
    backgroundColor:   c.accentCaution,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: space[1],
  },
  badgeText: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },

  // Appearance segmented control
  segmentedControl: {
    flexDirection:   'row',
    borderRadius:    radius.sm,
    borderWidth:     1,
    borderColor:     c.border,
    backgroundColor: c.bgElevated,
    overflow:        'hidden',
  },
  segment: {
    paddingHorizontal: space[3],
    paddingVertical:   space[1] + 2,
  },
  segmentActive: {
    backgroundColor: c.accentPrimary,
  },
  segmentLabel: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.interMedium,
    color:      c.textSecondary,
  },
  segmentLabelActive: {
    color: '#fff',
  },

  signOutButton: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               space[2],
    paddingVertical:   space[3],
    paddingHorizontal: space[5],
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       c.border,
    marginTop:         space[4],
  },
  signOutLabel: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      c.textSecondary,
  },
})
