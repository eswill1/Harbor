import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, CheckCircle } from 'phosphor-react-native'
import { router, useLocalSearchParams } from 'expo-router'

import { moderationApi, ApiError } from '../../../../../lib/api'
import { useAuthStore } from '../../../../../store/auth'
import { colors, fontSize, fontFamily, space, radius } from '../../../../../constants/tokens'

const MAX_CHARS = 1000

export default function AppealScreen() {
  const insets      = useSafeAreaInsets()
  const accessToken = useAuthStore((s) => s.accessToken)
  const { id }      = useLocalSearchParams<{ id: string }>()

  const [noticeContext, setNoticeContext] = useState<string>('')
  const [statement,     setStatement]     = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [submitted,     setSubmitted]     = useState(false)
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null)

  // Fetch the notice to show context
  useEffect(() => {
    if (!id || !accessToken) return
    moderationApi.getNotice(id, accessToken)
      .then((n) => setNoticeContext(n.plain_summary))
      .catch(() => {
        // Non-critical — context box stays empty
      })
  }, [id, accessToken])

  const handleSubmit = async () => {
    if (!id || !accessToken) return
    setSubmitting(true)
    setErrorMsg(null)
    try {
      await moderationApi.submitAppeal(id, statement.trim() || undefined, accessToken)
      setSubmitted(true)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrorMsg("You\u2019ve already submitted an appeal for this notice.")
        } else if (err.status === 410) {
          setErrorMsg("The appeal window for this notice has closed.")
        } else {
          setErrorMsg("Could not submit appeal. Please try again.")
        }
      } else {
        setErrorMsg("Could not submit appeal. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success state ──
  if (submitted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <CheckCircle size={56} color={colors.light.accentSuccess} weight="regular" />
          <Text style={styles.successTitle}>{"Appeal submitted"}</Text>
          <Text style={styles.successBody}>
            {"Most appeals are reviewed within 72 hours. We\u2019ll update your notice when a decision is made."}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnLabel}>{"Done"}</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // ── Form state ──
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ paddingTop: insets.top }}>
        {/* ── Back row ── */}
        <View style={styles.backRow}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={colors.light.textPrimary} weight="regular" />
            <Text style={styles.backLabel}>{"Appeal this decision"}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + space[8] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Explanation ── */}
        <Text style={styles.explanation}>
          {"Tell us what we may have missed, or why you believe this doesn\u2019t violate the guideline."}
        </Text>

        {/* ── Notice context (read-only) ── */}
        {noticeContext ? (
          <View style={styles.contextBox}>
            <Text style={styles.contextLabel}>{"Regarding:"}</Text>
            <Text style={styles.contextText}>{noticeContext}</Text>
          </View>
        ) : null}

        {/* ── Statement input ── */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{"Additional context (optional)"}</Text>
          <TextInput
            style={styles.textInput}
            value={statement}
            onChangeText={(t) => setStatement(t.slice(0, MAX_CHARS))}
            placeholder={"What should we know?"}
            placeholderTextColor={colors.light.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={MAX_CHARS}
          />
          <Text style={[styles.charCounter, statement.length >= MAX_CHARS && styles.charCounterOver]}>
            {statement.length}/{MAX_CHARS}
          </Text>
        </View>

        {/* ── Error message ── */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ── Submit button ── */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && { opacity: 0.8 },
            submitting && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnLabel}>{"Submit appeal"}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.light.bgBase,
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
    flexShrink:    1,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: space[5],
    gap:     space[5],
  },

  // Explanation
  explanation: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
    lineHeight: 24,
  },

  // Context box (read-only)
  contextBox: {
    backgroundColor: colors.light.bgElevated,
    borderRadius:    radius.md,
    padding:         space[4],
    gap:             space[2],
  },
  contextLabel: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.interBold,
    color:      colors.light.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  contextText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.lora,
    color:      colors.light.textSecondary,
    lineHeight: 22,
  },

  // Input
  inputGroup: {
    gap: space[2],
  },
  inputLabel: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textSecondary,
  },
  textInput: {
    borderWidth:       1,
    borderColor:       colors.light.border,
    borderRadius:      radius.md,
    padding:           space[4],
    minHeight:         160,
    fontSize:          fontSize.base,
    fontFamily:        fontFamily.inter,
    color:             colors.light.textPrimary,
    backgroundColor:   colors.light.bgSurface,
  },
  charCounter: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      colors.light.textMuted,
    textAlign:  'right',
  },
  charCounterOver: {
    color: colors.light.accentCaution,
  },

  // Error box
  errorBox: {
    backgroundColor: colors.light.accentCaution + '18',
    borderLeftWidth:  3,
    borderLeftColor:  colors.light.accentCaution,
    borderRadius:     radius.sm,
    padding:          space[4],
  },
  errorText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textPrimary,
    lineHeight: 22,
  },

  // Submit button
  submitBtn: {
    paddingVertical:   space[4],
    paddingHorizontal: space[5],
    borderRadius:      radius.md,
    backgroundColor:   colors.light.accentPrimary,
    alignItems:        'center',
    justifyContent:    'center',
    minHeight:         52,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },

  // Success state
  successContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: space[8],
    gap:            space[4],
  },
  successTitle: {
    fontSize:      fontSize.xl,
    fontFamily:    fontFamily.loraBold,
    color:         colors.light.textPrimary,
    letterSpacing: -0.5,
    textAlign:     'center',
  },
  successBody: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
    lineHeight: 24,
    textAlign:  'center',
  },
  doneBtn: {
    marginTop:         space[4],
    paddingVertical:   space[4],
    paddingHorizontal: space[8],
    borderRadius:      radius.md,
    backgroundColor:   colors.light.accentPrimary,
  },
  doneBtnLabel: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },
})
