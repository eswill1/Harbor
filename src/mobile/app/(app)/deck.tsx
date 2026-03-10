import { useState, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  Share,
  TextInput,
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
import { deckApi, shelvesApi, shareApi } from '../../lib/api'
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

// ─── Share Panel ──────────────────────────────────────────────────────────────

const POST_BASE_URL = 'https://dev.joinharbor.app/posts'

// Broadcast Pause: shown for high-arousal cards. Friction lives here, not on the card.
// reason is forward-compatible — currently only 'high_arousal' triggers the pause flow.
function SharePanel({
  card,
  visible,
  onClose,
  accessToken,
  theme,
}: {
  card:        { id: string; arousal_band: 'low' | 'medium' | 'high' } | null
  visible:     boolean
  onClose:     () => void
  accessToken: string | null
  theme:       typeof colors.light
}) {
  const insets        = useSafeAreaInsets()
  const styles        = useMemo(() => makeStyles(theme), [theme])
  const isHighArousal = card?.arousal_band === 'high'
  const isStub        = !card || card.id === '00000000-0000-0000-0000-000000000000'

  const [view, setView]         = useState<'options' | 'add_note'>('options')
  const [note, setNote]         = useState('')
  const [noteLink, setNoteLink] = useState('')

  useEffect(() => {
    if (visible) { setView('options'); setNote(''); setNoteLink('') }
  }, [visible])

  const logShare = (type: 'friend' | 'group' | 'copy_link') => {
    if (!card || isStub || !accessToken) return
    shareApi.log(card.id, type, accessToken).catch(() => {})
  }

  const handleBroadcast = async () => {
    if (!card) return
    logShare('copy_link')
    try { await Share.share({ message: `${POST_BASE_URL}/${card.id}` }) } catch {}
    onClose()
  }

  const handleShareWithNote = async () => {
    if (!card) return
    logShare('copy_link')
    const parts = [note.trim(), `${POST_BASE_URL}/${card.id}`, noteLink.trim()].filter(Boolean)
    try { await Share.share({ message: parts.join('\n\n') }) } catch {}
    onClose()
  }

  if (!card) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={[styles.modalSheet, { paddingBottom: insets.bottom + space[6] }]}>

        {/* Handle + title */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHandleBar} />
          <View style={styles.modalTitleRow}>
            {view === 'add_note' ? (
              <Pressable onPress={() => setView('options')} hitSlop={12}>
                <ArrowLeft size={18} color={theme.textPrimary} weight="bold" />
              </Pressable>
            ) : (
              <ShareNetwork size={18} color={theme.textPrimary} weight="bold" />
            )}
            <Text style={styles.modalTitle}>
              {view === 'add_note' ? 'Add a note' : 'Share'}
            </Text>
            <Pressable onPress={onClose} style={styles.modalCloseBtn} hitSlop={12}>
              <X size={18} color={theme.textMuted} weight="bold" />
            </Pressable>
          </View>
        </View>

        {view === 'options' ? (
          isHighArousal ? (
            // Broadcast Pause flow
            <>
              <View style={styles.broadcastPauseBox}>
                <Text style={styles.broadcastPauseHeadline}>Pause before broadcasting</Text>
                <Text style={styles.broadcastPauseBody}>
                  Broadcast sharing of this type of content often increases conflict. Consider sharing privately or adding context.
                </Text>
              </View>
              <View style={styles.shareOptions}>
                <Pressable
                  style={[styles.shareOption, styles.shareOptionPrimary]}
                  onPress={() => {
                    logShare('friend')
                    onClose()
                    Alert.alert('Coming soon', 'Direct messaging will be available in a future update.')
                  }}
                >
                  <View style={styles.shareOptionText}>
                    <Text style={[styles.shareOptionLabel, { color: theme.accentPrimary }]}>Share privately</Text>
                    <Text style={styles.shareOptionSub}>Direct message — coming soon</Text>
                  </View>
                </Pressable>
                <Pressable style={styles.shareOption} onPress={() => setView('add_note')}>
                  <View style={styles.shareOptionText}>
                    <Text style={styles.shareOptionLabel}>Add a note</Text>
                    <Text style={styles.shareOptionSub}>Share with your own context</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={[styles.shareOption, isStub && styles.shareOptionDisabled]}
                  onPress={isStub ? undefined : handleBroadcast}
                >
                  <View style={styles.shareOptionText}>
                    <Text style={[styles.shareOptionLabel, { color: theme.textMuted }]}>Broadcast anyway</Text>
                    <Text style={styles.shareOptionSub}>Share without adding context</Text>
                  </View>
                </Pressable>
              </View>
            </>
          ) : (
            // Normal share flow
            <View style={styles.shareOptions}>
              {[
                { label: 'Share with a friend', sub: 'Direct message — coming soon', disabled: true,  onPress: () => { logShare('friend'); onClose(); Alert.alert('Coming soon', 'Direct messaging will be available in a future update.') } },
                { label: 'Share to a group',    sub: 'Group sharing — coming soon',  disabled: true,  onPress: () => { logShare('group');  onClose(); Alert.alert('Coming soon', 'Group sharing will be available in a future update.') } },
                { label: 'Copy link',           sub: 'Share anywhere',               disabled: false, onPress: handleBroadcast },
              ].map(({ label, sub, disabled, onPress }) => (
                <Pressable
                  key={label}
                  style={[styles.shareOption, disabled && styles.shareOptionDisabled]}
                  onPress={disabled ? undefined : onPress}
                >
                  <View style={styles.shareOptionText}>
                    <Text style={[styles.shareOptionLabel, disabled && { color: theme.textMuted }]}>{label}</Text>
                    <Text style={styles.shareOptionSub}>{sub}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )
        ) : (
          // Add a note view
          <>
            <TextInput
              style={[styles.noteInput, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="What's your take on this?"
              placeholderTextColor={theme.textMuted}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={280}
              autoFocus
            />
            <TextInput
              style={[styles.noteLinkInput, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Add another source (optional)"
              placeholderTextColor={theme.textMuted}
              value={noteLink}
              onChangeText={setNoteLink}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Pressable
              style={[styles.shareOption, styles.shareOptionPrimary, !note.trim() && styles.shareOptionDisabled]}
              onPress={note.trim() ? handleShareWithNote : undefined}
            >
              <Text style={[styles.shareOptionLabel, { color: theme.accentPrimary }]}>Share with note</Text>
            </Pressable>
          </>
        )}
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
        <Text style={styles.satisfactionQ}>
          {isDone ? 'Thanks for the feedback.' : 'Did you get what you came for?'}
        </Text>
        <View style={styles.satisfactionEmojis}>
          {([
            { emoji: '😊', value: 1 as const },
            { emoji: '😐', value: 2 as const },
            { emoji: '😞', value: 3 as const },
          ]).map(({ emoji, value }) => {
            const isChosen = selected === value
            return (
              <Pressable
                key={value}
                style={[
                  styles.satisfactionEmoji,
                  isChosen && styles.satisfactionEmojiChosen,
                  isDone && !isChosen && styles.satisfactionEmojiDimmed,
                ]}
                onPress={() => handleSatisfaction(value)}
                disabled={isDone}
              >
                <Text style={[
                  styles.satisfactionEmojiText,
                  isChosen && styles.satisfactionEmojiTextChosen,
                ]}>
                  {emoji}
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
  const [showShare, setShowShare]       = useState(false)
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

      {/* ── Header: close + progress bar ── */}
      <View style={styles.deckHeader}>
        <Pressable
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.5 }]}
          onPress={handleChangeIntent}
        >
          <X size={20} color={theme.textSecondary} weight="bold" />
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
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
          <Pressable style={styles.actionBtn} onPress={() => setShowShare(true)}>
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

      {/* ── Share panel ── */}
      <SharePanel
        card={card}
        visible={showShare}
        onClose={() => setShowShare(false)}
        accessToken={accessToken}
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

  // Header
  deckHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: space[3],
    paddingVertical:   space[2],
    gap:           space[2],
  },
  closeBtn: {
    width:          32,
    height:         32,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Progress
  progressTrack: {
    flex:            1,
    height:          3,
    backgroundColor: c.border,
    borderRadius:    2,
  },
  progressFill: {
    height:          3,
    backgroundColor: c.accentPrimary,
    borderRadius:    2,
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
    gap:        space[4],
    width:      '100%',
  },
  satisfactionQ: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      c.textPrimary,
    textAlign:  'center',
  },
  satisfactionEmojis: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            space[5],
  },
  satisfactionEmoji: {
    width:          72,
    height:         72,
    borderRadius:   36,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: c.bgElevated,
  },
  satisfactionEmojiChosen: {
    backgroundColor: c.accentPrimary + '22',
    borderWidth:     2,
    borderColor:     c.accentPrimary,
  },
  satisfactionEmojiDimmed: {
    opacity: 0.30,
  },
  satisfactionEmojiText: {
    fontSize: 36,
  },
  satisfactionEmojiTextChosen: {
    fontSize: 40,
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

  // Broadcast Pause box (shown in share panel for high-arousal cards)
  broadcastPauseBox: {
    backgroundColor:   c.bgElevated,
    borderRadius:      radius.md,
    borderWidth:       1,
    borderColor:       c.border,
    paddingVertical:   space[3],
    paddingHorizontal: space[4],
    gap:               space[1],
  },
  broadcastPauseHeadline: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      c.textPrimary,
  },
  broadcastPauseBody: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
    lineHeight: 19,
  },

  // Share option — primary variant (highlighted border)
  shareOptionPrimary: {
    borderColor: c.accentPrimary,
  },

  // Add a note inputs
  noteInput: {
    borderWidth:       1,
    borderRadius:      radius.md,
    paddingVertical:   space[3],
    paddingHorizontal: space[4],
    fontSize:          fontSize.base,
    fontFamily:        fontFamily.inter,
    minHeight:         80,
    textAlignVertical: 'top',
  },
  noteLinkInput: {
    borderWidth:       1,
    borderRadius:      radius.md,
    paddingVertical:   space[3],
    paddingHorizontal: space[4],
    fontSize:          fontSize.sm,
    fontFamily:        fontFamily.inter,
  },

  shareOptions: {
    gap: space[2],
  },
  shareOption: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical:   space[4],
    paddingHorizontal: space[4],
    borderRadius:    radius.md,
    backgroundColor: c.bgElevated,
    borderWidth:     1,
    borderColor:     c.border,
  },
  shareOptionDisabled: {
    opacity: 0.5,
  },
  shareOptionText: {
    gap: 2,
  },
  shareOptionLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      c.textPrimary,
  },
  shareOptionSub: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      c.textMuted,
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
