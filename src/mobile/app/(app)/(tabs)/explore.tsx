import { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { UsersThree } from 'phosphor-react-native'
import { router, useFocusEffect } from 'expo-router'
import { feedApi, FeedPost } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { colors, fontSize, fontFamily, space, radius } from '../../../constants/tokens'
import { useTheme } from '../../../hooks/useTheme'

function timeAgo(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function FollowingScreen() {
  const insets      = useSafeAreaInsets()
  const accessToken = useAuthStore((s) => s.accessToken)
  const theme       = useTheme()
  const styles      = useMemo(() => makeStyles(theme), [theme])

  const [posts,       setPosts]       = useState<FeedPost[]>([])
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing,  setRefreshing]  = useState(false)
  const [error,       setError]       = useState(false)
  const [offset,      setOffset]      = useState(0)

  const loadFeed = useCallback(async (reset: boolean) => {
    if (!accessToken) return
    const nextOffset = reset ? 0 : offset

    if (reset) {
      setLoading(true)
      setError(false)
    } else {
      setLoadingMore(true)
    }

    try {
      const data = await feedApi.get(accessToken, 20, nextOffset)
      setPosts((prev) => reset ? data.posts : [...prev, ...data.posts])
      setTotal(data.total)
      setOffset(nextOffset + data.posts.length)
    } catch {
      if (reset) setError(true)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }, [accessToken, offset])

  // Reload on tab focus
  useFocusEffect(
    useCallback(() => {
      void loadFeed(true)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]),
  )

  const handleRefresh = () => {
    setRefreshing(true)
    setOffset(0)
    void loadFeed(true)
  }

  const handleLoadMore = () => {
    if (!loadingMore && posts.length < total) {
      void loadFeed(false)
    }
  }

  const renderPost = ({ item }: { item: FeedPost }) => {
    const initial = item.author.display_name.charAt(0).toUpperCase()
    return (
      <View style={styles.postItem}>
        <Pressable
          style={styles.postHeader}
          onPress={() =>
            router.push({ pathname: '/(app)/user/[id]', params: { id: item.author.id } })
          }
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.displayName}>{item.author.display_name}</Text>
            <Text style={styles.handle}>{"@"}{item.author.handle}</Text>
          </View>
        </Pressable>
        <Text style={styles.postBody}>{item.body}</Text>
        <Text style={styles.timestamp}>{timeAgo(item.created_at)}</Text>
      </View>
    )
  }

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.accentPrimary} />
      </View>
    )
  }

  // Loading state — initial load
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{"Following"}</Text>
          <Text style={styles.headerSubtitle}>{"Posts from people you follow"}</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accentPrimary} />
        </View>
      </View>
    )
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{"Following"}</Text>
          <Text style={styles.headerSubtitle}>{"Posts from people you follow"}</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{"Could not load feed."}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
            onPress={() => void loadFeed(true)}
          >
            <Text style={styles.retryBtnLabel}>{"Try again"}</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{"Following"}</Text>
        <Text style={styles.headerSubtitle}>{"Posts from people you follow"}</Text>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.accentPrimary}
          />
        }
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <UsersThree size={48} color={theme.accentPrimary} weight="regular" />
            <Text style={styles.emptyTitle}>{"Nothing here yet."}</Text>
            <Text style={styles.emptySubtitle}>
              {"Follow people from their profiles to see their posts."}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.emptyBtnLabel}>{"Find people \u2192"}</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  )
}

const makeStyles = (c: typeof colors.light) => StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: c.bgBase,
  },

  // Header
  header: {
    paddingHorizontal: space[5],
    paddingTop:        space[4],
    paddingBottom:     space[4],
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    gap:               4,
  },
  headerTitle: {
    fontSize:      fontSize.xl,
    fontFamily:    fontFamily.loraBold,
    color:         c.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
  },

  // Post item
  postItem: {
    paddingHorizontal: space[5],
    paddingVertical:   space[4],
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    backgroundColor:   c.bgBase,
    gap:               space[2],
  },
  postHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[3],
  },

  // Avatar
  avatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: c.accentPrimary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },

  // Author
  authorInfo: {
    flex: 1,
    gap:  2,
  },
  displayName: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      c.textPrimary,
  },
  handle: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
  },

  // Body
  postBody: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.lora,
    lineHeight: 24,
    color:      c.textPrimary,
  },

  // Timestamp
  timestamp: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      c.textMuted,
    textAlign:  'right',
  },

  // Footer loader
  footerLoader: {
    paddingVertical: space[4],
    alignItems:      'center',
  },

  // Centered (loading / error)
  centered: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            space[4],
  },

  // Error
  errorText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
  },
  retryBtn: {
    paddingVertical:   space[3],
    paddingHorizontal: space[5],
    borderRadius:      radius.md,
    backgroundColor:   c.accentPrimary,
  },
  retryBtnLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    gap:               space[4],
    paddingHorizontal: space[8],
  },
  emptyTitle: {
    fontSize:   fontSize.md,
    fontFamily: fontFamily.loraBold,
    color:      c.textPrimary,
    textAlign:  'center',
  },
  emptySubtitle: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
    textAlign:  'center',
    lineHeight: 24,
  },
  emptyBtn: {
    paddingVertical:   space[3],
    paddingHorizontal: space[5],
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       c.accentPrimary,
  },
  emptyBtnLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      c.accentPrimary,
  },
})
