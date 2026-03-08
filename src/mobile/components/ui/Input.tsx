import { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native'
import { colors, fontSize, fontFamily, radius, space } from '../../constants/tokens'

interface InputProps extends TextInputProps {
  label:  string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          error  && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.light.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: space[1],
  },
  label: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interMedium,
    color:      colors.light.textSecondary,
    marginBottom: 4,
  },
  input: {
    height:          52,
    borderWidth:     1.5,
    borderColor:     colors.light.border,
    borderRadius:    radius.md,
    paddingHorizontal: space[4],
    fontSize:        fontSize.base,
    fontFamily:      fontFamily.inter,
    color:           colors.light.textPrimary,
    backgroundColor: colors.light.bgSurface,
  },
  inputFocused: {
    borderColor: colors.light.accentPrimary,
  },
  inputError: {
    borderColor: colors.light.accentCaution,
  },
  error: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      colors.light.accentCaution,
    marginTop:  4,
  },
})
