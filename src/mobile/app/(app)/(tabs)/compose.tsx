import { useState, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'phosphor-react-native'
import { router } from 'expo-router'

import { postsApi } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { colors, fontSize, fontFamily, space, radius } from '../../../constants/tokens'
import { useTheme } from '../../../hooks/useTheme'

const MAX_CHARS = 500

export default function ComposeScreen() {
  const insets      = useSafeAreaInsets()
  const accessToken = useAuthStore((s) => s.accessToken)
  const theme       = useTheme()
  const styles      = useMemo(() => makeStyles(theme), [theme])
  const [content, setContent]   = useState('')
  const [loading, setLoading]   = useState(false)

  const charCount   = content.length
  const isOverLimit = charCount > MAX_CHARS
  const isEmpty     = content.trim().length === 0
  const canPost     = !isEmpty && !isOverLimit && !loading

  const handlePost = async () => {
    if (!canPost || !accessToken) return
    setLoading(true)
    try {
      await postsApi.create(content.trim(), accessToken)
      setContent('')
      router.back()
    } catch {
      Alert.alert('Error', 'Could not post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* ── Header row ── */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={theme.textPrimary} weight="regular" />
          </Pressable>

          <Text style={styles.title}>{"What's on your mind?"}</Text>

          <Pressable
            style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={!canPost}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[styles.postBtnLabel, !canPost && styles.postBtnLabelDisabled]}>
                {"Post"}
              </Text>
            )}
          </Pressable>
        </View>

        {/* ── Input area ── */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={"Share something..."}
            placeholderTextColor={theme.textMuted}
            multiline
            value={content}
            onChangeText={setContent}
            autoFocus
            textAlignVertical="top"
          />
        </View>

        {/* ── Character counter ── */}
        <View style={[styles.counterRow, { paddingBottom: insets.bottom + space[3] }]}>
          <Text style={[styles.counter, isOverLimit && styles.counterOver]}>
            {charCount} {"/"} {MAX_CHARS}
          </Text>
        </View>

      </View>
    </KeyboardAvoidingView>
  )
}

const makeStyles = (c: typeof colors.light) => StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: c.bgBase,
  },
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: space[4],
    paddingVertical:   space[3],
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  backBtn: {
    width:  36,
    height: 36,
    alignItems:  'center',
    justifyContent: 'center',
  },
  title: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.loraBold,
    color:      c.textPrimary,
    flex:       1,
    textAlign:  'center',
    paddingHorizontal: space[2],
  },
  postBtn: {
    backgroundColor:   c.accentPrimary,
    paddingVertical:   space[2],
    paddingHorizontal: space[4],
    borderRadius:      radius.full,
    minWidth:          60,
    alignItems:        'center',
    justifyContent:    'center',
  },
  postBtnDisabled: {
    backgroundColor: c.border,
  },
  postBtnLabel: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
  },
  postBtnLabelDisabled: {
    color: c.textMuted,
  },

  // Input
  inputWrapper: {
    flex:    1,
    padding: space[5],
  },
  input: {
    flex:       1,
    fontSize:   fontSize.md,
    fontFamily: fontFamily.lora,
    color:      c.textPrimary,
    lineHeight: 28,
    minHeight:  120,
  },

  // Counter
  counterRow: {
    paddingHorizontal: space[5],
    paddingTop:        space[2],
    alignItems:        'flex-end',
  },
  counter: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textMuted,
  },
  counterOver: {
    color: '#D0493A',
  },
})
