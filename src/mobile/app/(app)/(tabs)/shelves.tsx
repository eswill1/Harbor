import { useState, useCallback, useMemo, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BookmarksSimple, CaretRight, Plus } from 'phosphor-react-native'
import { router, useFocusEffect } from 'expo-router'

import { shelvesApi, Shelf } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { colors, fontSize, fontFamily, space, radius } from '../../../constants/tokens'
import { useTheme } from '../../../hooks/useTheme'

export default function ShelvesScreen() {
  const insets      = useSafeAreaInsets()
  const accessToken = useAuthStore((s) => s.accessToken)
  const theme       = useTheme()
  const styles      = useMemo(() => makeStyles(theme), [theme])

  const [shelves, setShelves]       = useState<Shelf[]>([])
  const [loading, setLoading]       = useState(true)
  const [modalVisible, setModal]    = useState(false)
  const [shelfName, setShelfName]   = useState('')
  const inputRef                    = useRef<TextInput>(null)

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
    setShelfName('')
    setModal(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleModalConfirm = () => {
    const name = shelfName.trim()
    setModal(false)
    if (name) void handleCreate(name)
  }

  const handleModalCancel = () => {
    setModal(false)
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
      <CaretRight size={18} color={theme.textMuted} weight="regular" />
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
          <Plus size={22} color={theme.accentPrimary} weight="bold" />
        </Pressable>
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accentPrimary} />
        </View>
      ) : (
        <FlatList
          data={shelves}
          keyExtractor={(item) => item.id}
          renderItem={renderShelf}
          contentContainerStyle={shelves.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <BookmarksSimple size={48} color={theme.textMuted} weight="regular" />
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

      {/* ── New Shelf Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleModalCancel}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{"New Shelf"}</Text>
            <TextInput
              ref={inputRef}
              style={styles.modalInput}
              placeholder="Shelf name"
              placeholderTextColor={theme.textMuted}
              value={shelfName}
              onChangeText={setShelfName}
              onSubmitEditing={handleModalConfirm}
              returnKeyType="done"
              autoCapitalize="words"
              maxLength={80}
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnCancel, pressed && { opacity: 0.7 }]}
                onPress={handleModalCancel}
              >
                <Text style={styles.modalBtnCancelLabel}>{"Cancel"}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnConfirm, pressed && { opacity: 0.7 }]}
                onPress={handleModalConfirm}
              >
                <Text style={styles.modalBtnConfirmLabel}>{"Create"}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: space[5],
    paddingVertical:   space[4],
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  headerTitle: {
    fontSize:      fontSize.xl,
    fontFamily:    fontFamily.loraBold,
    color:         c.textPrimary,
    letterSpacing: -0.5,
  },
  addBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: c.bgElevated,
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
    borderBottomColor: c.border,
    backgroundColor:   c.bgBase,
  },
  rowContent: {
    flex: 1,
    gap:  2,
  },
  rowName: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      c.textPrimary,
  },
  rowCount: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
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
    color:      c.textSecondary,
  },
  emptyBtn: {
    paddingVertical:   space[3],
    paddingHorizontal: space[5],
    borderRadius:      radius.md,
    backgroundColor:   c.accentPrimary,
  },
  emptyBtnLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },

  // New shelf modal
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: space[5],
  },
  modalBox: {
    width:           '100%',
    backgroundColor: c.bgElevated,
    borderRadius:    radius.lg,
    padding:         space[5],
    gap:             space[4],
  },
  modalTitle: {
    fontSize:   fontSize.lg,
    fontFamily: fontFamily.loraBold,
    color:      c.textPrimary,
  },
  modalInput: {
    borderWidth:   1,
    borderColor:   c.border,
    borderRadius:  radius.md,
    paddingVertical:   space[3],
    paddingHorizontal: space[4],
    fontSize:      fontSize.base,
    fontFamily:    fontFamily.inter,
    color:         c.textPrimary,
    backgroundColor: c.bgBase,
  },
  modalButtons: {
    flexDirection: 'row',
    gap:           space[3],
  },
  modalBtn: {
    flex:            1,
    paddingVertical: space[3],
    borderRadius:    radius.md,
    alignItems:      'center',
  },
  modalBtnCancel: {
    backgroundColor: c.bgBase,
    borderWidth:     1,
    borderColor:     c.border,
  },
  modalBtnCancelLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      c.textSecondary,
  },
  modalBtnConfirm: {
    backgroundColor: c.accentPrimary,
  },
  modalBtnConfirmLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },
})
