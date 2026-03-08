import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native'
import { colors, fontSize, fontFamily, radius, space } from '../../constants/tokens'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends TouchableOpacityProps {
  label:    string
  variant?: Variant
  loading?: boolean
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#fff' : colors.light.accentPrimary}
          size="small"
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    height:         52,
    borderRadius:   radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: space[6],
  },
  primary: {
    backgroundColor: colors.light.accentPrimary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth:     1.5,
    borderColor:     colors.light.accentPrimary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.interBold,
  },
  primaryLabel: {
    color: '#fff',
  },
  secondaryLabel: {
    color: colors.light.accentPrimary,
  },
  ghostLabel: {
    color: colors.light.textSecondary,
  },
})
