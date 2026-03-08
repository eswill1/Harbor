import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  CaretLeft,
  CaretRight,
  Anchor,
  BookmarkSimple,
  ChatCircle,
  ShareNetwork,
  Question,
  ArrowsClockwise,
  ArrowLeft,
} from 'phosphor-react-native'
import { router } from 'expo-router'

import { colors, fontSize, fontFamily, space, radius, shadow } from '../../constants/tokens'
import { useSessionStore } from '../../store/session'
import { useAuthStore } from '../../store/auth'
import { deckApi, shelvesApi } from '../../lib/api'

// ─── Source bucket labels ─────────────────────────────────────────────────────

const BUCKET_LABELS: Record<string, string> = {
  friends:   'From your friends',
  groups:    'From your groups',
  shelves:   'From your shelves',
  discovery: 'Adjacent discovery',
}

const BUCKET_COLORS: Record<string, string> = {
  friends:   colors.light.accentPrimary,
  groups:    colors.light.accentSuccess,
  shelves:   colors.light.accentCaution,
  discovery: colors.light.accentCivic,
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({ onNewDeck, onChangeIntent }: {
  onNewDeck:      () => void
  onChangeIntent: () => void
}) {
  const insets     = useSafeAreaInsets()
  const sessionId  = useSessionStore((s) => s.sessionId)
  const accessToken = useAuthStore((s) => s.accessToken)
  const clearDeck  = useSessionStore((s) => s.clearDeck)
  const [selected, setSelected] = useState<1 | 2 | 3 | null>(null)

  const handleSatisfaction = async (value: 1 | 2 | 3) => {
    if (!sessionId || !accessToken || selected !== null) return
    setSelected(value)
    try {
      await deckApi.complete(sessionId, value, accessToken)
    } catch {
      // Non-critical — don't surface to user
    }
    if (value === 1) {
      // "Yes, I'm done" — go back to intent selector
      onChangeIntent()
    }
  }

  const isDone = selected !== null

  return (
    <View style={[styles.completion, { paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[6] }]}>
      <Anchor size={48} color={colors.light.accentPrimary} weight="regular" />

      <Text style={styles.completionTitle}>You're all caught up.</Text>
      <Text style={styles.completionSub}>That was your 20-card deck.</Text>

      <View style={styles.satisfactionRow}>
        {isDone ? (
          <Text style={styles.satisfactionThanks}>Thanks for the feedback.</Text>
        ) : (
          <Text style={styles.satisfactionQ}>Did you get what you came for?</Text>
        )}
        <View style={styles.satisfactionButtons}>
          {([
            { label: "Yes, I'm done", value: 1 as const },
            { label: 'Sort of',       value: 2 as const },
            { label: 'Not really',    value: 3 as const },
          ]).map(({ label, value }) => {
            const isChosen = selected === value
            return (
              <Pressable
                key={value}
                style={[
                  styles.satisfactionBtn,
                  isChosen && styles.satisfactionBtnPrimary,
                  isDone && !isChosen && styles.satisfactionBtnDimmed,
                ]}
                onPress={() => handleSatisfaction(value)}
                disabled={isDone}
              >
                <Text style={[
                  styles.satisfactionBtnText,
                  isChosen && styles.satisfactionBtnTextPrimary,
                ]}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.completionDivider} />

      <Pressable style={styles.secondaryAction} onPress={onNewDeck}>
        <ArrowsClockwise size={18} color={colors.light.textSecondary} weight="regular" />
        <Text style={styles.secondaryActionText}>Load another deck</Text>
      </Pressable>

      <Pressable style={styles.secondaryAction} onPress={onChangeIntent}>
        <ArrowLeft size={18} color={colors.light.textSecondary} weight="regular" />
        <Text style={styles.secondaryActionText}>Switch intent</Text>
      </Pressable>
    </View>
  )
}

// ─── Main deck screen ─────────────────────────────────────────────────────────

export default function DeckScreen() {
  const insets      = useSafeAreaInsets()
  const { cards, cardIndex, advanceCard, retreatCard, clearDeck, currentIntent, setDeck } = useSessionStore()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [reloading, setReloading] = useState(false)
  const [saving, setSaving]       = useState(false)

  const isComplete  = cardIndex >= cards.length && cards.length > 0
  const card        = cards[cardIndex]
  const progress    = cards.length > 0 ? (cardIndex) / cards.length : 0

  const handleNewDeck = async () => {
    if (!currentIntent || !accessToken) return
    setReloading(true)
    try {
      const deck = await deckApi.create(currentIntent, accessToken)
      setDeck(deck.session_id, deck.cards)
    } catch {
      Alert.alert('Error', 'Could not load a new deck. Please try again.')
    } finally {
      setReloading(false)
    }
  }

  const handleChangeIntent = () => {
    clearDeck()
    router.back()
  }

  const handleCreatorPress = () => {
    if (card && card.creator.id && card.creator.id !== '00000000-0000-0000-0000-000000000000') {
      router.push({ pathname: '/(app)/user/[id]', params: { id: card.creator.id } })
    }
  }

  const handleSave = async () => {
    if (!accessToken || saving || !card) return
    if (card.id === '00000000-0000-0000-0000-000000000000') {
      Alert.alert('Cannot save', 'This is a sample card and cannot be saved.')
      return
    }
    setSaving(true)
    try {
      const shelves = await shelvesApi.list(accessToken)
      if (shelves.length === 0) {
        Alert.alert('No shelves', 'Create a shelf first from the Shelves tab.')
        return
      }
      Alert.alert(
        'Save to shelf',
        'Choose a shelf:',
        [
          ...shelves.map((shelf) => ({
            text: shelf.name,
            onPress: async () => {
              try {
                await shelvesApi.saveItem(shelf.id, card.id, accessToken)
                Alert.alert('Saved', `Added to "${shelf.name}"`)
              } catch {
                Alert.alert('Error', 'Could not save. Please try again.')
              }
            },
          })),
          { text: 'Cancel', style: 'cancel' as const },
        ],
      )
    } catch {
      Alert.alert('Error', 'Could not load shelves.')
    } finally {
      setSaving(false)
    }
  }

  if (cards.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>No deck loaded.</Text>
        <Pressable onPress={handleChangeIntent}>
          <Text style={styles.emptyLink}>← Choose an intent</Text>
        </Pressable>
      </View>
    )
  }

  if (isComplete) {
    return (
      <CompletionScreen
        onNewDeck={handleNewDeck}
        onChangeIntent={handleChangeIntent}
      />
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Progress bar ── */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* ── Card ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Pressable
          onPress={handleCreatorPress}
          style={({ pressed }) => [styles.cardHeader, pressed && { opacity: 0.7 }]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {card.creator.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorName}>{card.creator.name}</Text>
            <Text style={styles.creatorHandle}>@{card.creator.handle}</Text>
          </View>
        </Pressable>

        {/* Source bucket pill */}
        <View style={[styles.bucketPill, { backgroundColor: BUCKET_COLORS[card.source_bucket] + '18' }]}>
          <View style={[styles.bucketDot, { backgroundColor: BUCKET_COLORS[card.source_bucket] }]} />
          <Text style={[styles.bucketText, { color: BUCKET_COLORS[card.source_bucket] }]}>
            {BUCKET_LABELS[card.source_bucket]}
          </Text>
        </View>

        {/* Content */}
        <Text style={styles.content}>{card.content}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={handleSave} disabled={saving}>
            <BookmarkSimple
              size={20}
              color={saving ? colors.light.accentPrimary : colors.light.textSecondary}
              weight={saving ? 'fill' : 'regular'}
            />
            <Text style={styles.actionLabel}>Save</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <ChatCircle size={20} color={colors.light.textSecondary} weight="regular" />
            <Text style={styles.actionLabel}>Reply</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <ShareNetwork size={20} color={colors.light.textSecondary} weight="regular" />
            <Text style={styles.actionLabel}>Share</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Footer: Why this? + counter + nav ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + space[2] }]}>
        <Pressable
          style={styles.whyThis}
          onPress={() => Alert.alert('Why this?', 'Signal explanations are coming in a future sprint.')}
        >
          <Question size={16} color={colors.light.textMuted} weight="regular" />
          <Text style={styles.whyThisText}>Why this?</Text>
        </Pressable>

        <View style={styles.nav}>
          <Pressable
            style={[styles.navBtn, cardIndex === 0 && styles.navBtnDisabled]}
            onPress={retreatCard}
            disabled={cardIndex === 0}
          >
            <CaretLeft size={20} color={cardIndex === 0 ? colors.light.textMuted : colors.light.textPrimary} weight="bold" />
          </Pressable>

          <Text style={styles.counter}>{cardIndex + 1} of {cards.length}</Text>

          <Pressable style={styles.navBtn} onPress={advanceCard}>
            <CaretRight size={20} color={colors.light.textPrimary} weight="bold" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.light.bgBase,
  },

  // Progress
  progressTrack: {
    height:          3,
    backgroundColor: colors.light.border,
  },
  progressFill: {
    height:          3,
    backgroundColor: colors.light.accentPrimary,
  },

  // Card scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding:    space[5],
    paddingTop: space[6],
    gap:        space[4],
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[3],
  },
  avatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: colors.light.accentPrimary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: {
    fontSize:   fontSize.md,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },
  creatorInfo: {
    gap: 2,
  },
  creatorName: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      colors.light.textPrimary,
  },
  creatorHandle: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
  },

  // Bucket pill
  bucketPill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             space[1],
    alignSelf:       'flex-start',
    paddingVertical:   4,
    paddingHorizontal: space[3],
    borderRadius:    radius.full,
  },
  bucketDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  bucketText: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.interMedium,
    letterSpacing: 0.2,
  },

  // Content
  content: {
    fontSize:   fontSize.md,
    fontFamily: fontFamily.lora,
    color:      colors.light.textPrimary,
    lineHeight: 28,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap:           space[4],
    paddingTop:    space[2],
    borderTopWidth:  1,
    borderTopColor:  colors.light.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[1],
    paddingVertical: space[2],
  },
  actionLabel: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textSecondary,
  },

  // Footer
  footer: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: space[5],
    paddingTop:      space[3],
    borderTopWidth:  1,
    borderTopColor:  colors.light.border,
    backgroundColor: colors.light.bgBase,
  },
  whyThis: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[1],
  },
  whyThisText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textMuted,
  },
  nav: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[4],
  },
  navBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: colors.light.bgElevated,
    alignItems:      'center',
    justifyContent:  'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  counter: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textSecondary,
    minWidth:   52,
    textAlign:  'center',
  },

  // Completion
  completion: {
    flex:              1,
    backgroundColor:   colors.light.bgBase,
    alignItems:        'center',
    paddingHorizontal: space[8],
    gap:               space[5],
  },
  completionTitle: {
    fontSize:     fontSize.xl,
    fontFamily:   fontFamily.loraBold,
    color:        colors.light.textPrimary,
    letterSpacing: -0.5,
    textAlign:    'center',
  },
  completionSub: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
    marginTop:  -space[3],
  },
  satisfactionRow: {
    alignItems: 'center',
    gap:        space[3],
    width:      '100%',
  },
  satisfactionQ: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textPrimary,
    textAlign:  'center',
  },
  satisfactionThanks: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.accentPrimary,
    textAlign:  'center',
  },
  satisfactionButtons: {
    gap:   space[2],
    width: '100%',
  },
  satisfactionBtn: {
    paddingVertical:   space[3],
    paddingHorizontal: space[5],
    borderRadius:      radius.md,
    borderWidth:       1.5,
    borderColor:       colors.light.border,
    alignItems:        'center',
  },
  satisfactionBtnPrimary: {
    backgroundColor: colors.light.accentPrimary,
    borderColor:     colors.light.accentPrimary,
  },
  satisfactionBtnDimmed: {
    opacity: 0.35,
  },
  satisfactionBtnText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textSecondary,
  },
  satisfactionBtnTextPrimary: {
    color:      '#fff',
    fontFamily: fontFamily.interBold,
  },
  completionDivider: {
    width:           '100%',
    height:          1,
    backgroundColor: colors.light.border,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[2],
  },
  secondaryActionText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
  },

  // Empty state
  empty: {
    flex:            1,
    backgroundColor: colors.light.bgBase,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             space[3],
  },
  emptyText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
  },
  emptyLink: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.accentPrimary,
  },
})
