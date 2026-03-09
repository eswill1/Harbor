import { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'phosphor-react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { shelvesApi, ShelfItem } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { colors, fontSize, fontFamily, space, radius } from '../../../constants/tokens'
import { useTheme } from '../../../hooks/useTheme'

function relativeTime(isoString: string): string {
  const diffMs  = Date.now() - new Date(isoString).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60)  return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60)  return `${diffMin}m ago`
  const diffH   = Math.floor(diffMin / 60)
  if (diffH < 24)    return `${diffH}h ago`
  const diffD   = Math.floor(diffH / 24)
  return `${diffD} days ago`
}

export default function ShelfDetailScreen() {
  const insets      = useSafeAreaInsets()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>()
  const theme       = useTheme()
  const styles      = useMemo(() => makeStyles(theme), [theme])

  const [items, setItems]   = useState<ShelfItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !accessToken) return
    setLoading(true)
    shelvesApi.items(id, accessToken)
      .then(setItems)
      .catch(() => Alert.alert('Error', 'Could not load shelf items.'))
      .finally(() => setLoading(false))
  }, [id, accessToken])

  const handleRemoveItem = (item: ShelfItem) => {
    Alert.alert(
      'Remove Item',
      'Remove this post from the shelf?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!id || !accessToken) return
            // Optimistic removal
            setItems((prev) => prev.filter((i) => i.id !== item.id))
            try {
              await shelvesApi.removeItem(id, item.content_id, accessToken)
            } catch {
              // Roll back
              setItems((prev) => [...prev, item])
              Alert.alert('Error', 'Could not remove item.')
            }
          },
        },
      ],
    )
  }

  const renderItem = ({ item }: { item: ShelfItem }) => {
    const initial = item.post.author.display_name.charAt(0).toUpperCase()
    return (
      <Pressable
        style={({ pressed }) => [styles.itemRow, pressed && { opacity: 0.7 }]}
        onLongPress={() => handleRemoveItem(item)}
      >
        {/* Author row */}
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.displayName}>{item.post.author.display_name}</Text>
            <Text style={styles.handle}>{"@"}{item.post.author.handle}</Text>
          </View>
        </View>

        {/* Post body */}
        <Text style={styles.body}>{item.post.body}</Text>

        {/* Saved timestamp */}
        <Text style={styles.savedAt}>{"Saved "}{relativeTime(item.saved_at)}</Text>
      </Pressable>
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Back row ── */}
      <View style={styles.backRow}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={theme.textPrimary} weight="regular" />
          <Text style={styles.backLabel} numberOfLines={1}>{name ?? 'Shelf'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accentPrimary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{"Nothing saved here yet."}</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const makeStyles = (c: typeof colors.light) => StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: c.bgBase,
  },

  // Back row
  backRow: {
    paddingHorizontal: space[4],
    paddingVertical:   space[3],
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[2],
    alignSelf:     'flex-start',
    maxWidth:      '90%',
  },
  backLabel: {
    fontSize:   fontSize.md,
    fontFamily: fontFamily.loraBold,
    color:      c.textPrimary,
    letterSpacing: -0.3,
    flexShrink:  1,
  },

  // Centered loading
  centered: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Item rows
  itemRow: {
    paddingHorizontal: space[5],
    paddingVertical:   space[4],
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    gap:               space[3],
  },
  authorRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[3],
  },
  avatar: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: c.accentPrimary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },
  authorInfo: {
    gap: 1,
  },
  displayName: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interBold,
    color:      c.textPrimary,
  },
  handle: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
  },
  body: {
    fontSize:   fontSize.md,
    fontFamily: fontFamily.lora,
    color:      c.textPrimary,
    lineHeight: 26,
  },
  savedAt: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      c.textMuted,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: space[8],
  },
  emptyText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
    textAlign:  'center',
  },

  // Stats / misc
  statDivider: {
    width:           1,
    height:          24,
    backgroundColor: c.border,
    marginHorizontal: space[3],
  },
  retryBtn: {
    paddingVertical:   space[2],
    paddingHorizontal: space[5],
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       c.border,
  },
  retryLabel: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      c.accentPrimary,
  },
})
