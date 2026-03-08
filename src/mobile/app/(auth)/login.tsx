import { useState } from 'react'
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

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
  const { setAuth } = useAuthStore()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const next: typeof errors = {}
    if (!email.trim())    next.email    = 'Email is required'
    if (!password.trim()) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const result = await authApi.login({ email: email.trim(), password })
      await setAuth(result.user, result.access_token, result.refresh_token)
      router.replace('/(app)')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setErrors({ email: 'Invalid email or password' })
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
          { paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[8] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>Harbor</Text>
          <Text style={styles.tagline}>The feed you can finish.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />
          <Button
            label="Sign in"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.light.bgBase,
  },
  container: {
    flexGrow:          1,
    paddingHorizontal: space[6],
    justifyContent:    'center',
    gap:               space[8],
  },
  header: {
    alignItems: 'center',
    gap:        space[2],
  },
  wordmark: {
    fontSize:   fontSize['2xl'],
    fontFamily: fontFamily.interBold,
    color:      colors.light.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
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
    alignItems:     'center',
  },
  footerText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
  },
  footerLink: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interSemibold,
    color:      colors.light.accentPrimary,
  },
})
