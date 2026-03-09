import { useState, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { authApi, ApiError } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { colors, fontSize, fontFamily, space } from '../../constants/tokens'
import { useTheme } from '../../hooks/useTheme'

interface FormErrors {
  handle?:       string
  display_name?: string
  email?:        string
  password?:     string
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets()
  const { setAuth } = useAuthStore()
  const theme = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])

  const [handle,      setHandle]      = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [errors,      setErrors]      = useState<FormErrors>({})

  const validate = () => {
    const next: FormErrors = {}
    if (!handle.trim() || handle.length < 3)
      next.handle = 'Handle must be at least 3 characters'
    if (!displayName.trim())
      next.display_name = 'Display name is required'
    if (!email.trim())
      next.email = 'Email is required'
    if (!password || password.length < 8)
      next.password = 'Password must be at least 8 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleRegister = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const result = await authApi.register({
        handle:       handle.trim().toLowerCase(),
        display_name: displayName.trim(),
        email:        email.trim(),
        password,
      })
      await setAuth(result.user, result.access_token, result.refresh_token)
      router.replace('/(app)')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ handle: 'Handle or email already taken' })
      } else {
        Alert.alert('Something went wrong', 'Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + space[6], paddingBottom: insets.bottom + space[8] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Harbor is a place to arrive with purpose.</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Handle"
            value={handle}
            onChangeText={setHandle}
            placeholder="yourhandle"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.handle}
          />
          <Input
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your Name"
            autoCorrect={false}
            error={errors.display_name}
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="8+ characters"
            secureTextEntry
            error={errors.password}
          />
          <Button
            label="Create account"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const makeStyles = (c: typeof colors.light) => StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: c.bgBase,
  },
  container: {
    flexGrow:          1,
    paddingHorizontal: space[6],
    gap:               space[8],
  },
  header: {
    gap: space[2],
  },
  title: {
    fontSize:   fontSize.xl,
    fontFamily: fontFamily.interBold,
    color:      c.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
  },
  form: {
    gap: space[4],
  },
  submitButton: {
    marginTop: space[2],
  },
  footer: {
    flexDirection:  'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
  },
  footerLink: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interSemibold,
    color:      c.accentPrimary,
  },
})
