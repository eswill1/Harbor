import { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Modal,
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
  X,
  Sparkle,
} from 'phosphor-react-native'
import { router } from 'expo-router'

import { colors, fontSize, fontFamily, space, radius, shadow } from '../../constants/tokens'
import { useSessionStore } from '../../store/session'
import { useAuthStore } from '../../store/auth'
import { deckApi, shelvesApi } from '../../lib/api'
import { useTheme } from '../../hooks/useTheme'

// ─── Source bucket labels ─────────────────────────────────────────────────────

const BUCKET_LABELS: Record<string, string> = {
  friends:   'From your friends',
  groups:    'From your groups',
  shelves:   'From your shelves',
  discovery: 'Adjacent discovery',
}

// BUCKET_COLORS are resolved from the theme at render time (see getBucketColor)
function getBucketColor(bucket: string, c: typeof colors.light): string {
  switch (bucket) {
    case 'friends':   return c.accentPrimary
    case 'groups':    return c.accentSuccess
    case 'shelves':   return c.accentCaution
    case 'discovery': return c.accentCivic
    default:          return c.textMuted
  }
}

const BUCKET_REASONS: Record<string, string> = {
  friends:   "You follow this person. Harbor prioritizes people you've connected with.",
  groups:    "This came from a group you've joined. Harbor shows you what your communities are discussing.",
  shelves:   "This matches a topic on one of your shelves. Harbor uses your shelves as your interest library.",
  discovery: "This is adjacent to your interests. Harbor includes a small amount of discovery to help you find new things — but it's capped.",
}

// ─── Why This? Panel ──────────────────────────────────────────────────────────

type WhyThisCard = {
  source_bucket:  string
  is_serendipity: boolean
  creator:        { name: string; handle: string }
}

function WhyThisPanel({
  card,
  visible,
  onClose,
  theme,
}: {
  card:    WhyThisCard | null
  visible: boolean
  onClose: () => void
  theme:   typeof colors.light
}) {
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => makeStyles(theme), [theme])
  if (!card) return null

  const bucketColor  = getBucketColor(card.source_bucket, theme)
  const bucketLabel  = BUCKET_LABELS[card.source_bucket] ?? card.source_bucket
  const bucketReason = BUCKET_REASONS[card.source_bucket] ?? 'Harbor selected this based on your interests.'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={[styles.modalSheet, { paddingBottom: insets.bottom + space[6] }]}>

        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHandleBar} />
          <View style={styles.modalTitleRow}>
            <Question size={18} color={theme.textPrimary} weight="bold" />
            <Text style={styles.modalTitle}>Why this?</Text>
            <Pressable onPress={onClose} style={styles.modalCloseBtn} hitSlop={12}>
              <X size={18} color={theme.textMuted} weight="bold" />
            </Pressable>
          </View>
        </View>

        {/* Source bucket reason */}
        <View style={styles.modalSection}>
          <View style={[styles.modalBucketBadge, { backgroundColor: bucketColor + '18' }]}>
            <View style={[styles.bucketDot, { backgroundColor: bucketColor }]} />
            <Text style={[styles.bucketText, { color: bucketColor }]}>{bucketLabel}</Text>
          </View>
          <Text style={styles.modalReason}>{bucketReason}</Text>
        </View>

        {/* Creator */}
        <View style={styles.modalDivider} />
        <View style={styles.modalSection}>
          <Text style={styles.modalSectionLabel}>Creator</Text>
          <Text style={styles.modalCreatorName}>{card.creator.name}</Text>
          <Text style={styles.modalCreatorHandle}>@{card.creator.handle}</Text>
        </View>

        {/* Serendipity disclosure */}
        {card.is_serendipity && (
          <>
            <View style={styles.modalDivider} />
            <View style={[styles.modalSection, styles.modalSerendipityRow]}>
              <Sparkle size={16} color={theme.accentCivic} weight="fill" />
              <Text style={styles.modalSerendipityText}>
                This is a serendipity pick — slightly outside your usual interests. Harbor keeps this capped at 10–15% of your deck.
              </Text>
            </View>
          </>
        )}

        {/* P1 note */}
        <View style={styles.modalDivider} />
        <Text style={styles.modalFootnote}>
          You'll be able to edit these signals — "less of this," "more from friends" — in a future update.
        </Text>

      </View>
    </Modal>
  )
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({ onNewDeck, onChangeIntent, theme }: {
  onNewDeck:      () => void
  onChangeIntent: () => void
  theme:          typeof colors.light
}) {
  const insets     = useSafeAreaInsets()
  const sessionId  = useSessionStore((s) => s.sessionId)
  const accessToken = useAuthStore((s) => s.accessToken)
  const clearDeck  = useSessionStore((s) => s.clearDeck)
  const [selected, setSelected] = useState<1 | 2 | 3 | null>(null)
  const styles = useMemo(() => makeStyles(theme), [theme])

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
      <Anchor size={48} color={theme.accentPrimary} weight="regular" />

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
        <ArrowsClockwise size={18} color={theme.textSecondary} weight="regular" />
        <Text style={styles.secondaryActionText}>Load another deck</Text>
      </Pressable>

      <Pressable style={styles.secondaryAction} onPress={onChangeIntent}>
        <ArrowLeft size={18} color={theme.textSecondary} weight="regular" />
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
  const [reloading, setReloading]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [showWhyThis, setShowWhyThis]   = useState(false)
  const theme  = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])

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
        theme={theme}
      />
    )
  }

  const bucketColor = getBucketColor(card.source_bucket, theme)

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
        <View style={[styles.bucketPill, { backgroundColor: bucketColor + '18' }]}>
          <View style={[styles.bucketDot, { backgroundColor: bucketColor }]} />
          <Text style={[styles.bucketText, { color: bucketColor }]}>
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
              color={saving ? theme.accentPrimary : theme.textSecondary}
              weight={saving ? 'fill' : 'regular'}
            />
            <Text style={styles.actionLabel}>Save</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <ChatCircle size={20} color={theme.textSecondary} weight="regular" />
            <Text style={styles.actionLabel}>Reply</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <ShareNetwork size={20} color={theme.textSecondary} weight="regular" />
            <Text style={styles.actionLabel}>Share</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Why This? panel ── */}
      <WhyThisPanel
        card={card}
        visible={showWhyThis}
        onClose={() => setShowWhyThis(false)}
        theme={theme}
      />

      {/* ── Footer: Why this? + counter + nav ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + space[2] }]}>
        <Pressable
          style={styles.whyThis}
          onPress={() => setShowWhyThis(true)}
        >
          <Question size={16} color={theme.textMuted} weight="regular" />
          <Text style={styles.whyThisText}>Why this?</Text>
        </Pressable>

        <View style={styles.nav}>
          <Pressable
            style={[styles.navBtn, cardIndex === 0 && styles.navBtnDisabled]}
            onPress={retreatCard}
            disabled={cardIndex === 0}
          >
            <CaretLeft size={20} color={cardIndex === 0 ? theme.textMuted : theme.textPrimary} weight="bold" />
          </Pressable>

          <Text style={styles.counter}>{cardIndex + 1} of {cards.length}</Text>

          <Pressable style={styles.navBtn} onPress={advanceCard}>
            <CaretRight size={20} color={theme.textPrimary} weight="bold" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (c: typeof colors.light) => StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: c.bgBase,
  },

  // Progress
  progressTrack: {
    height:          3,
    backgroundColor: c.border,
  },
  progressFill: {
    height:          3,
    backgroundColor: c.accentPrimary,
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
    backgroundColor: c.accentPrimary,
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
    color:      c.textPrimary,
  },
  creatorHandle: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
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
    color:      c.textPrimary,
    lineHeight: 28,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap:           space[4],
    paddingTop:    space[2],
    borderTopWidth:  1,
    borderTopColor:  c.border,
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
    color:      c.textSecondary,
  },

  // Footer
  footer: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: space[5],
    paddingTop:      space[3],
    borderTopWidth:  1,
    borderTopColor:  c.border,
    backgroundColor: c.bgBase,
  },
  whyThis: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[1],
  },
  whyThisText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textMuted,
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
    backgroundColor: c.bgElevated,
    alignItems:      'center',
    justifyContent:  'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  counter: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      c.textSecondary,
    minWidth:   52,
    textAlign:  'center',
  },

  // Completion
  completion: {
    flex:              1,
    backgroundColor:   c.bgBase,
    alignItems:        'center',
    paddingHorizontal: space[8],
    gap:               space[5],
  },
  completionTitle: {
    fontSize:     fontSize.xl,
    fontFamily:   fontFamily.loraBold,
    color:        c.textPrimary,
    letterSpacing: -0.5,
    textAlign:    'center',
  },
  completionSub: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
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
    color:      c.textPrimary,
    textAlign:  'center',
  },
  satisfactionThanks: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      c.accentPrimary,
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
    borderColor:       c.border,
    alignItems:        'center',
  },
  satisfactionBtnPrimary: {
    backgroundColor: c.accentPrimary,
    borderColor:     c.accentPrimary,
  },
  satisfactionBtnDimmed: {
    opacity: 0.35,
  },
  satisfactionBtnText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      c.textSecondary,
  },
  satisfactionBtnTextPrimary: {
    color:      '#fff',
    fontFamily: fontFamily.interBold,
  },
  completionDivider: {
    width:           '100%',
    height:          1,
    backgroundColor: c.border,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[2],
  },
  secondaryActionText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
  },

  // Why This? modal
  modalBackdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor:   c.bgBase,
    borderTopLeftRadius:  radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal:    space[5],
    paddingTop:           space[3],
    gap:                  space[4],
    ...shadow.md,
  },
  modalHandleBar: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: c.border,
    alignSelf:       'center',
    marginBottom:    space[2],
  },
  modalHeader: {
    gap: space[1],
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[2],
  },
  modalTitle: {
    flex:       1,
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      c.textPrimary,
  },
  modalCloseBtn: {
    padding: space[1],
  },
  modalSection: {
    gap: space[2],
  },
  modalBucketBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               space[1],
    alignSelf:         'flex-start',
    paddingVertical:   4,
    paddingHorizontal: space[3],
    borderRadius:      radius.full,
  },
  modalReason: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      c.textPrimary,
    lineHeight: 22,
  },
  modalDivider: {
    height:          1,
    backgroundColor: c.border,
  },
  modalSectionLabel: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.interMedium,
    color:      c.textMuted,
    textTransform: 'uppercase',
    letterSpacing:  0.6,
  },
  modalCreatorName: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      c.textPrimary,
  },
  modalCreatorHandle: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
    marginTop:  -space[1],
  },
  modalSerendipityRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           space[2],
  },
  modalSerendipityText: {
    flex:       1,
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.accentCivic,
    lineHeight: 20,
  },
  modalFootnote: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textMuted,
    lineHeight: 19,
    paddingBottom: space[2],
  },

  // Empty state
  empty: {
    flex:            1,
    backgroundColor: c.bgBase,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             space[3],
  },
  emptyText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
  },
  emptyLink: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      c.accentPrimary,
  },
})
