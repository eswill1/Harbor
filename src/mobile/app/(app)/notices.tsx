/*
 * NOTICES SCREEN — User test cases
 *
 * 1. Profile tab → tap "Notices" — should show empty state if no notices exist
 * 2. After admin creates a notice via API: Notices row on profile shows unread dot
 * 3. Tap Notices → list shows notice with amber unread dot, correct display name and policy section
 * 4. Tap notice → detail shows all sections; unread dot clears on next list view
 * 5. Tap "Appeal this decision" → appeal form appears
 * 6. Submit appeal with optional text → confirmation screen shown, no duplicate submission possible
 * 7. Return to notice detail → appeal status row replaces appeal button
 * 8. Notice with can_repost=true → amber instructions box shown in detail
 * 9. Notice past appeal_deadline → "Appeal window closed" shown, button absent
 * 10. Pull-to-refresh on notices list works
 */

import { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, CheckCircle, CaretRight, Warning } from 'phosphor-react-native'
import { router, useFocusEffect } from 'expo-router'

import { moderationApi, Notice, NoticeType } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { colors, fontSize, fontFamily, space, radius } from '../../constants/tokens'

const PAGE_SIZE = 20

const NOTICE_DISPLAY_NAMES: Record<NoticeType, string> = {
  content_labeled:              'Label applied',
  content_interstitial:         'Warning added',
  content_distribution_limited: 'Reach limited',
  content_removed:              'Content removed',
  account_feature_limited:      'Feature restricted',
  account_suspended:            'Account suspended',
  account_banned:               'Account removed',
  appeal_outcome:               'Appeal decision',
}

function timeAgo(isoString: string): string {
  const diffMs  = Date.now() - new Date(isoString).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60)  return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60)  return `${diffMin}m ago`
  const diffH   = Math.floor(diffMin / 60)
  if (diffH < 24)    return `${diffH}h ago`
  const diffD   = Math.floor(diffH / 24)
  if (diffD < 30)    return `${diffD}d ago`
  const diffMo  = Math.floor(diffD / 30)
  if (diffMo < 12)   return `${diffMo}mo ago`
  return `${Math.floor(diffMo / 12)}y ago`
}

function stripPolicySectionPrefix(raw: string): string {
  // Strip "guidelines#" prefix if present, e.g. "guidelines#harassment" → "Harassment"
  const slug = raw.replace(/^guidelines#/, '')
  // Capitalise first letter, replace hyphens with spaces
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
}

export default function NoticesScreen() {
  const insets      = useSafeAreaInsets()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [notices,     setNotices]     = useState<Notice[]>([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore,     setHasMore]     = useState(true)
  const [error,       setError]       = useState(false)

  const fetchPage = useCallback(async (offset: number, replace: boolean) => {
    if (!accessToken) return
    try {
      const data = await moderationApi.getNotices(accessToken, offset)
      setError(false)
      if (replace) {
        setNotices(data)
      } else {
        setNotices((prev) => [...prev, ...data])
      }
      setHasMore(data.length === PAGE_SIZE)
    } catch {
      setError(true)
    }
  }, [accessToken])

  const loadInitial = useCallback(async () => {
    setLoading(true)
    await fetchPage(0, true)
    setLoading(false)
  }, [fetchPage])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchPage(0, true)
    setRefreshing(false)
  }, [fetchPage])

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await fetchPage(notices.length, false)
    setLoadingMore(false)
  }, [loadingMore, hasMore, notices.length, fetchPage])

  useFocusEffect(
    useCallback(() => {
      void loadInitial()
    }, [loadInitial]),
  )

  const renderNotice = ({ item }: { item: Notice }) => {
    const displayName  = NOTICE_DISPLAY_NAMES[item.notice_type] ?? item.notice_type
    const policyLabel  = stripPolicySectionPrefix(item.policy_section)
    const isUnread     = item.read_at === null

    return (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        onPress={() =>
          router.push({ pathname: '/(app)/notice/[id]', params: { id: item.id } })
        }
      >
        <View style={styles.rowContent}>
          <View style={styles.rowTitleRow}>
            {isUnread && <View style={styles.unreadDot} />}
            <Text style={[styles.rowTitle, isUnread && styles.rowTitleUnread]} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <Text style={styles.rowPolicy}>{policyLabel}</Text>
          <Text style={styles.rowSummary} numberOfLines={1}>{item.plain_summary}</Text>
          <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
        </View>
        <CaretRight size={18} color={colors.light.textMuted} weight="regular" />
      </Pressable>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={colors.light.textPrimary} weight="regular" />
        </Pressable>
        <Text style={styles.headerTitle}>{"Notices"}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.light.accentPrimary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Warning size={40} color={colors.light.textMuted} weight="regular" />
          <Text style={styles.errorText}>{"Could not load notices."}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
            onPress={loadInitial}
          >
            <Text style={styles.retryLabel}>{"Try again"}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item.id}
          renderItem={renderNotice}
          contentContainerStyle={notices.length === 0 ? styles.emptyContainer : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.light.accentPrimary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.light.textMuted} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CheckCircle size={48} color={colors.light.accentSuccess} weight="regular" />
              <Text style={styles.emptyTitle}>{"No notices. You\u2019re all good."}</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.light.bgBase,
  },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: space[4],
    paddingVertical:   space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  backBtn: {
    width:  40,
    height: 40,
    alignItems:     'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex:          1,
    textAlign:     'center',
    fontSize:      fontSize.xl,
    fontFamily:    fontFamily.loraBold,
    color:         colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 40,
  },

  // List row
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: space[5],
    paddingVertical:   space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    backgroundColor:   colors.light.bgBase,
  },
  rowContent: {
    flex: 1,
    gap:  4,
    marginRight: space[3],
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[2],
  },
  unreadDot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: colors.light.accentCaution,
  },
  rowTitle: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textPrimary,
    flex:       1,
  },
  rowTitleUnread: {
    fontFamily: fontFamily.interBold,
  },
  rowPolicy: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
  },
  rowSummary: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textMuted,
  },
  rowTime: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      colors.light.textMuted,
    marginTop:  2,
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
    textAlign:  'center',
  },
  retryBtn: {
    paddingVertical:   space[3],
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

  // Empty state
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            space[4],
    paddingHorizontal: space[8],
  },
  emptyTitle: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textSecondary,
    textAlign:  'center',
  },

  // Footer loader
  footerLoader: {
    paddingVertical: space[4],
    alignItems:      'center',
  },
})
