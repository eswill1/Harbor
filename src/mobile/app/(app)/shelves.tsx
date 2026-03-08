import { useState, useCallback } from 'react'
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
import { BookmarksSimple, CaretRight, Plus } from 'phosphor-react-native'
import { router, useFocusEffect } from 'expo-router'

import { shelvesApi, Shelf } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { colors, fontSize, fontFamily, space, radius } from '../../constants/tokens'

export default function ShelvesScreen() {
  const insets      = useSafeAreaInsets()
  const accessToken = useAuthStore((s) => s.accessToken)

  const [shelves, setShelves] = useState<Shelf[]>([])
  const [loading, setLoading] = useState(true)

  const loadShelves = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const data = await shelvesApi.list(accessToken)
      setShelves(data)
    } catch {
      Alert.alert('Error', 'Could not load shelves.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useFocusEffect(
    useCallback(() => {
      void loadShelves()
    }, [loadShelves]),
  )

  const handleCreate = async (name: string) => {
    if (!accessToken) return
    try {
      await shelvesApi.create(name, accessToken)
      await loadShelves()
    } catch {
      Alert.alert('Error', 'Could not create shelf.')
    }
  }

  const handleCreatePrompt = () => {
    Alert.prompt(
      'New Shelf',
      'Enter a name for your shelf',
      (name) => { if (name?.trim()) void handleCreate(name.trim()) },
      'plain-text',
    )
  }

  const handleDelete = (shelf: Shelf) => {
    Alert.alert(
      'Delete Shelf',
      `Delete "${shelf.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!accessToken) return
            // Optimistic removal
            setShelves((prev) => prev.filter((s) => s.id !== shelf.id))
            try {
              await shelvesApi.remove(shelf.id, accessToken)
            } catch {
              // Roll back
              setShelves((prev) => [...prev, shelf])
              Alert.alert('Error', 'Could not delete shelf.')
            }
          },
        },
      ],
    )
  }

  const renderShelf = ({ item }: { item: Shelf }) => (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      onPress={() =>
        router.push({ pathname: '/(app)/shelf/[id]', params: { id: item.id, name: item.name } })
      }
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowCount}>{item.item_count} saved</Text>
      </View>
      <CaretRight size={18} color={colors.light.textMuted} weight="regular" />
    </Pressable>
  )

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{"Your Shelves"}</Text>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.6 }]}
          onPress={handleCreatePrompt}
        >
          <Plus size={22} color={colors.light.accentPrimary} weight="bold" />
        </Pressable>
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.light.accentPrimary} />
        </View>
      ) : (
        <FlatList
          data={shelves}
          keyExtractor={(item) => item.id}
          renderItem={renderShelf}
          contentContainerStyle={shelves.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BookmarksSimple size={48} color={colors.light.textMuted} weight="regular" />
              <Text style={styles.emptyTitle}>{"No shelves yet"}</Text>
              <Pressable
                style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.7 }]}
                onPress={handleCreatePrompt}
              >
                <Text style={styles.emptyBtnLabel}>{"Create your first shelf"}</Text>
              </Pressable>
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
    justifyContent:    'space-between',
    paddingHorizontal: space[5],
    paddingVertical:   space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerTitle: {
    fontSize:      fontSize.xl,
    fontFamily:    fontFamily.loraBold,
    color:         colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  addBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: colors.light.bgElevated,
    alignItems:      'center',
    justifyContent:  'center',
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
    gap:  2,
  },
  rowName: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      colors.light.textPrimary,
  },
  rowCount: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
  },

  // Centered loading
  centered: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
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
  },
  emptyBtn: {
    paddingVertical:   space[3],
    paddingHorizontal: space[5],
    borderRadius:      radius.md,
    backgroundColor:   colors.light.accentPrimary,
  },
  emptyBtnLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },
})
