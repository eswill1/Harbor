import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Warning, ArrowSquareOut, SealCheck } from 'phosphor-react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { moderationApi, Notice, Appeal, NoticeType } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { colors, fontSize, fontFamily, space, radius } from '../../../constants/tokens'

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

const APPEAL_STATUS_LABELS: Record<Appeal['status'], string> = {
  pending:    'Under review',
  upheld:     'Upheld',
  overturned: 'Overturned',
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })
}

function stripPolicySectionPrefix(raw: string): string {
  const slug = raw.replace(/^guidelines#/, '')
  return slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
}

function isDeadlinePassed(deadline: string | null): boolean {
  if (!deadline) return false
  return new Date(deadline).getTime() < Date.now()
}

export default function NoticeDetailScreen() {
  const insets      = useSafeAreaInsets()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { id }      = useLocalSearchParams<{ id: string }>()

  const [notice,  setNotice]  = useState<Notice | null>(null)
  const [appeal,  setAppeal]  = useState<Appeal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    if (!id || !accessToken) return
    setLoading(true)
    moderationApi.getNotice(id, accessToken)
      .then(async (n) => {
        setNotice(n)
        if (n.appeal_id) {
          try {
            const a = await moderationApi.getAppeal(n.appeal_id, accessToken)
            setAppeal(a)
          } catch {
            // Non-critical
          }
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id, accessToken])

  if (loading) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.light.accentPrimary} />
      </View>
    )
  }

  if (error || !notice) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <BackRow onBack={() => router.back()} />
        <Warning size={40} color={colors.light.textMuted} weight="regular" />
        <Text style={styles.errorText}>{"Could not load notice."}</Text>
        <Pressable
          style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
          onPress={() => {
            if (!id || !accessToken) return
            setLoading(true)
            setError(false)
            moderationApi.getNotice(id, accessToken)
              .then(setNotice)
              .catch(() => setError(true))
              .finally(() => setLoading(false))
          }}
        >
          <Text style={styles.retryLabel}>{"Try again"}</Text>
        </Pressable>
      </View>
    )
  }

  const displayName   = NOTICE_DISPLAY_NAMES[notice.notice_type] ?? notice.notice_type
  const policyLabel   = stripPolicySectionPrefix(notice.policy_section)
  const deadlinePassed = isDeadlinePassed(notice.appeal_deadline)
  const hasAppeal     = notice.appeal_id !== null
  const canAppeal     = !hasAppeal && !deadlinePassed
  const guidelinesUrl = 'https://joinharbor.app/guidelines'

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackRow onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header section ── */}
        <View style={styles.section}>
          <Text style={styles.noticeType}>{displayName}</Text>
          <Text style={styles.policySubtitle}>{policyLabel}</Text>
          <Text style={styles.timestamp}>{formatDate(notice.created_at)}</Text>
        </View>

        <View style={styles.divider} />

        {/* ── What happened ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>{"What happened"}</Text>
          <Text style={styles.bodyText}>{notice.plain_summary}</Text>
        </View>

        {/* ── What was affected ── */}
        {notice.affected_excerpt ? (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>{"What was affected"}</Text>
              <View style={styles.quoteBlock}>
                <Text style={styles.quoteText}>{notice.affected_excerpt}</Text>
              </View>
            </View>
          </>
        ) : null}

        <View style={styles.divider} />

        {/* ── Action taken ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>{"Action taken"}</Text>
          <Text style={styles.bodyText}>{notice.action_taken}</Text>
          {notice.action_end ? (
            <Text style={styles.durationText}>
              {"Ends: "}{formatDate(notice.action_end)}
            </Text>
          ) : (
            <Text style={styles.durationText}>{"Duration: Permanent."}</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Ranking vs enforcement ── */}
        <View style={styles.section}>
          <Text style={styles.rankingNote}>
            {"This is a policy enforcement action, not a ranking decision."}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* ── What you can do ── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>{"What you can do"}</Text>

          {/* Repost instructions */}
          {notice.can_repost && notice.repost_instructions ? (
            <View style={styles.cautionBox}>
              <Text style={styles.cautionBoxText}>{notice.repost_instructions}</Text>
            </View>
          ) : null}

          {/* Read guideline link */}
          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
            onPress={() => Linking.openURL(guidelinesUrl)}
          >
            <Text style={styles.linkText}>{"Read the guideline"}</Text>
            <ArrowSquareOut size={16} color={colors.light.accentPrimary} weight="regular" />
          </Pressable>

          {/* Appeal status row (if appeal exists) */}
          {hasAppeal && appeal ? (
            <Pressable
              style={({ pressed }) => [styles.appealStatusRow, pressed && { opacity: 0.7 }]}
              onPress={() =>
                router.push({ pathname: '/(app)/notice/[id]/appeal', params: { id: notice.id } })
              }
            >
              <SealCheck size={20} color={colors.light.accentPrimary} weight="regular" />
              <View style={styles.appealStatusContent}>
                <Text style={styles.appealStatusLabel}>{"Appeal submitted"}</Text>
                <Text style={styles.appealStatusSub}>
                  {APPEAL_STATUS_LABELS[appeal.status]}
                  {appeal.outcome_note ? ` — ${appeal.outcome_note}` : ''}
                </Text>
              </View>
              <ArrowSquareOut size={16} color={colors.light.textMuted} weight="regular" />
            </Pressable>
          ) : null}

          {/* Appeal button */}
          {canAppeal ? (
            <Pressable
              style={({ pressed }) => [styles.appealBtn, pressed && { opacity: 0.8 }]}
              onPress={() =>
                router.push({ pathname: '/(app)/notice/[id]/appeal', params: { id: notice.id } })
              }
            >
              <Text style={styles.appealBtnLabel}>{"Appeal this decision"}</Text>
            </Pressable>
          ) : null}

          {/* Appeal window closed */}
          {!hasAppeal && deadlinePassed ? (
            <Text style={styles.appealClosedText}>{"Appeal window closed."}</Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  )
}

function BackRow({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.backRow}>
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        onPress={onBack}
      >
        <ArrowLeft size={22} color={colors.light.textPrimary} weight="regular" />
        <Text style={styles.backLabel}>{"Notices"}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.light.bgBase,
  },
  centered: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            space[4],
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
    fontSize:      fontSize.md,
    fontFamily:    fontFamily.loraBold,
    color:         colors.light.textPrimary,
    letterSpacing: -0.3,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: space[10],
  },

  // Section
  section: {
    paddingHorizontal: space[5],
    paddingVertical:   space[5],
    gap:               space[2],
  },
  divider: {
    height:          1,
    backgroundColor: colors.light.border,
    marginHorizontal: space[5],
  },

  // Header section
  noticeType: {
    fontSize:      fontSize.xl,
    fontFamily:    fontFamily.loraBold,
    color:         colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  policySubtitle: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
  },
  timestamp: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textMuted,
    marginTop:  space[1],
  },

  // Section headings + body
  sectionHeading: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interBold,
    color:      colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom:  space[1],
  },
  bodyText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.lora,
    color:      colors.light.textPrimary,
    lineHeight: 26,
  },
  durationText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textSecondary,
    marginTop:  space[1],
  },

  // Quote block
  quoteBlock: {
    borderLeftWidth:  3,
    borderLeftColor:  colors.light.borderStrong,
    paddingLeft:      space[4],
    paddingVertical:  space[2],
    backgroundColor:  colors.light.bgElevated,
    borderRadius:     radius.sm,
  },
  quoteText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.lora,
    color:      colors.light.textSecondary,
    lineHeight: 22,
  },

  // Ranking note
  rankingNote: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textMuted,
    lineHeight: 20,
    fontStyle:  'italic',
  },

  // Caution / amber box
  cautionBox: {
    backgroundColor: colors.light.accentCaution + '18',
    borderLeftWidth:  3,
    borderLeftColor:  colors.light.accentCaution,
    borderRadius:     radius.sm,
    padding:          space[4],
    marginBottom:     space[2],
  },
  cautionBoxText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textPrimary,
    lineHeight: 22,
  },

  // Link row
  linkRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           space[2],
    paddingVertical: space[2],
  },
  linkText: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.accentPrimary,
  },

  // Appeal status row
  appealStatusRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            space[3],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius:   radius.md,
    borderWidth:    1,
    borderColor:    colors.light.border,
    backgroundColor: colors.light.bgSurface,
    marginTop:      space[2],
  },
  appealStatusContent: {
    flex: 1,
    gap:  2,
  },
  appealStatusLabel: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textPrimary,
  },
  appealStatusSub: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
  },

  // Appeal button
  appealBtn: {
    marginTop:         space[3],
    paddingVertical:   space[4],
    paddingHorizontal: space[5],
    borderRadius:      radius.md,
    backgroundColor:   colors.light.accentPrimary,
    alignItems:        'center',
  },
  appealBtnLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },

  // Appeal window closed
  appealClosedText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textMuted,
    marginTop:  space[2],
  },

  // Error state
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
})
