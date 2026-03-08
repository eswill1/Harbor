import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'phosphor-react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { usersApi, UserProfile } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { colors, fontSize, fontFamily, space, radius } from '../../../constants/tokens'

export default function UserProfileScreen() {
  const insets      = useSafeAreaInsets()
  const { id }      = useLocalSearchParams<{ id: string }>()
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)

  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const isOwnProfile = !!profile && !!currentUser && profile.id === currentUser.id

  const loadProfile = useCallback(async () => {
    if (!id || !accessToken) return
    setLoading(true)
    setError(false)
    try {
      const data = await usersApi.profile(id, accessToken)
      setProfile(data)
      setFollowing(data.is_following)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id, accessToken])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleFollowToggle = async () => {
    if (!id || !accessToken || !profile || followLoading) return
    const wasFollowing = following
    setFollowing(!wasFollowing)
    setFollowLoading(true)
    try {
      if (wasFollowing) {
        await usersApi.unfollow(id, accessToken)
        setProfile((prev) =>
          prev ? { ...prev, follower_count: prev.follower_count - 1, is_following: false } : prev,
        )
      } else {
        await usersApi.follow(id, accessToken)
        setProfile((prev) =>
          prev ? { ...prev, follower_count: prev.follower_count + 1, is_following: true } : prev,
        )
      }
    } catch {
      setFollowing(wasFollowing)
      Alert.alert('Error', 'Could not update follow status. Please try again.')
    } finally {
      setFollowLoading(false)
    }
  }

  const initial = profile?.display_name.charAt(0).toUpperCase() ?? '?'

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Back row ── */}
      <View style={styles.backRow}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={colors.light.textPrimary} weight="regular" />
          <Text style={styles.backLabel}>{"Back"}</Text>
        </Pressable>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.light.accentPrimary} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{"Could not load profile."}</Text>
          <Pressable style={styles.retryBtn} onPress={loadProfile}>
            <Text style={styles.retryLabel}>{"Try again"}</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && profile && (
        <View style={styles.content}>

          {/* ── Avatar ── */}
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>

          {/* ── Name + handle ── */}
          <Text style={styles.displayName}>{profile.display_name}</Text>
          <Text style={styles.handle}>{"@"}{profile.handle}</Text>

          {/* ── Stats row ── */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{profile.post_count}</Text>
              <Text style={styles.statLabel}>{"Posts"}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{profile.follower_count}</Text>
              <Text style={styles.statLabel}>{"Followers"}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{profile.following_count}</Text>
              <Text style={styles.statLabel}>{"Following"}</Text>
            </View>
          </View>

          {/* ── Follow / Unfollow button ── */}
          {!isOwnProfile && (
            <Pressable
              style={[
                styles.followBtn,
                following ? styles.followBtnSecondary : styles.followBtnPrimary,
              ]}
              onPress={handleFollowToggle}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator
                  size="small"
                  color={following ? colors.light.textSecondary : '#fff'}
                />
              ) : (
                <Text style={[
                  styles.followBtnLabel,
                  following ? styles.followBtnLabelSecondary : styles.followBtnLabelPrimary,
                ]}>
                  {following ? "Following" : "Follow"}
                </Text>
              )}
            </Pressable>
          )}

        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.light.bgBase,
  },

  // Back row
  backRow: {
    paddingHorizontal: space[4],
    paddingVertical:   space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[2],
    alignSelf:     'flex-start',
  },
  backLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textPrimary,
  },

  // Centered states
  centered: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            space[4],
  },
  errorText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
  },
  retryBtn: {
    paddingVertical:   space[2],
    paddingHorizontal: space[5],
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       colors.light.border,
  },
  retryLabel: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.accentPrimary,
  },

  // Profile content
  content: {
    flex:              1,
    alignItems:        'center',
    paddingHorizontal: space[8],
    paddingTop:        space[10],
    gap:               space[4],
  },
  avatar: {
    width:           88,
    height:          88,
    borderRadius:    44,
    backgroundColor: colors.light.accentPrimary,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    space[2],
  },
  avatarInitial: {
    fontSize:   fontSize.xl,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },
  displayName: {
    fontSize:      fontSize.xl,
    fontFamily:    fontFamily.loraBold,
    color:         colors.light.textPrimary,
    letterSpacing: -0.4,
    textAlign:     'center',
  },
  handle: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
    marginTop:  -space[2],
  },

  // Stats
  statsRow: {
    flexDirection:   'row',
    alignItems:      'center',
    marginTop:       space[2],
    paddingVertical: space[4],
    paddingHorizontal: space[6],
    backgroundColor: colors.light.bgSurface,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.light.border,
  },
  statItem: {
    flex:       1,
    alignItems: 'center',
    gap:        2,
  },
  statCount: {
    fontSize:   fontSize.lg,
    fontFamily: fontFamily.interBold,
    color:      colors.light.textPrimary,
  },
  statLabel: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      colors.light.textMuted,
    letterSpacing: 0.2,
  },
  statDivider: {
    width:           1,
    height:          32,
    backgroundColor: colors.light.border,
    marginHorizontal: space[3],
  },

  // Follow button
  followBtn: {
    marginTop:         space[2],
    paddingVertical:   space[3],
    paddingHorizontal: space[8],
    borderRadius:      radius.full,
    minWidth:          140,
    alignItems:        'center',
    justifyContent:    'center',
    borderWidth:       1.5,
  },
  followBtnPrimary: {
    backgroundColor: colors.light.accentPrimary,
    borderColor:     colors.light.accentPrimary,
  },
  followBtnSecondary: {
    backgroundColor: 'transparent',
    borderColor:     colors.light.border,
  },
  followBtnLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
  },
  followBtnLabelPrimary: {
    color: '#fff',
  },
  followBtnLabelSecondary: {
    color: colors.light.textSecondary,
  },
})
