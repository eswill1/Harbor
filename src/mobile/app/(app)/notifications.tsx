import { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, UserPlus, BookmarkSimple } from 'phosphor-react-native'
import { router } from 'expo-router'

import { notificationsApi, type AppNotification } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { useNotificationStore } from '../../store/notifications'
import { colors, fontSize, fontFamily, space, radius } from '../../constants/tokens'
import { useTheme } from '../../hooks/useTheme'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)   return 'just now'
  if (mins  < 60)  return `${mins}m`
  if (hours < 24)  return `${hours}h`
  if (days  < 7)   return `${days}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function notificationText(n: AppNotification): string {
  if (n.type === 'follow')     return `@${n.actor.handle} started following you`
  if (n.type === 'shelf_save') return `@${n.actor.handle} saved your post`
  return ''
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function NotificationRow({
  item,
  theme,
  styles,
}: {
  item:   AppNotification
  theme:  typeof colors.light
  styles: ReturnType<typeof makeStyles>
}) {
  const isUnread = item.read_at === null

  const handlePress = () => {
    if (item.type === 'follow' && item.actor.id) {
      router.push(`/(app)/user/${item.actor.id}`)
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        isUnread && styles.rowUnread,
        pressed && { opacity: 0.75 },
      ]}
      onPress={handlePress}
    >
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: theme.accentPrimary + '18' }]}>
        {item.type === 'follow' ? (
          <UserPlus size={18} color={theme.accentPrimary} weight="regular" />
        ) : (
          <BookmarkSimple size={18} color={theme.accentPrimary} weight="regular" />
        )}
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        <Text style={styles.rowText}>{notificationText(item)}</Text>
        {item.content_body && (
          <Text style={styles.contentSnippet} numberOfLines={1}>
            {item.content_body}
          </Text>
        )}
        <Text style={styles.time}>{relativeTime(item.created_at)}</Text>
      </View>

      {/* Unread dot */}
      {isUnread && <View style={styles.unreadDot} />}
    </Pressable>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const insets      = useSafeAreaInsets()
  const accessToken = useAuthStore((s) => s.accessToken)
  const markRead    = useNotificationStore((s) => s.markRead)
  const theme       = useTheme()
  const styles      = useMemo(() => makeStyles(theme), [theme])

  const [items, setItems]     = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!accessToken) return
    notificationsApi.list(accessToken)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))

    // Mark all read on open
    notificationsApi.markRead(accessToken).then(markRead).catch(() => {})
  }, [accessToken])

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={theme.textPrimary} weight="regular" />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.textMuted} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No notifications yet.</Text>
          <Text style={styles.emptyHint}>
            {"You'll see follows and shelf saves here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationRow item={item} theme={theme} styles={styles} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: insets.bottom + space[6] }}
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (c: typeof colors.light) => StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: c.bgBase,
  },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: space[4],
    paddingVertical:   space[3],
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  backBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  title: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.loraBold,
    color:      c.textPrimary,
  },

  // List rows
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: space[4],
    paddingVertical:   space[4],
    gap:               space[3],
  },
  rowUnread: {
    backgroundColor: c.accentPrimary + '0A',
  },
  iconWrap: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  textWrap: {
    flex: 1,
    gap:  2,
  },
  rowText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textPrimary,
    lineHeight: 20,
  },
  contentSnippet: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
    fontStyle:  'italic',
    marginTop:  2,
  },
  time: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      c.textMuted,
    marginTop:  2,
  },
  unreadDot: {
    width:         8,
    height:        8,
    borderRadius:  4,
    backgroundColor: c.accentPrimary,
    flexShrink:    0,
  },
  separator: {
    height:          1,
    backgroundColor: c.border,
    marginLeft:      space[4] + 40 + space[3],
  },

  // Empty / loading
  center: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            space[2],
  },
  emptyText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.loraBold,
    color:      c.textPrimary,
  },
  emptyHint: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textMuted,
    textAlign:  'center',
  },
})
