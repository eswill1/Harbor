import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { colors, fontSize, fontFamily, space, radius } from '../../constants/tokens'
import { Button } from '../../components/ui/Button'
import { useSessionStore } from '../../store/session'

const INTENT_LABELS: Record<string, string> = {
  catch_up: 'Catch Up',
  learn:    'Learn',
  connect:  'Connect',
  create:   'Create',
  delight:  'Delight',
  explore:  'Explore',
  civic:    'Civic',
}

export default function DeckScreen() {
  const insets        = useSafeAreaInsets()
  const currentIntent = useSessionStore((s) => s.currentIntent)
  const label         = currentIntent ? INTENT_LABELS[currentIntent] : '—'

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{label}</Text>
      </View>

      <Text style={styles.title}>Your deck is coming.</Text>
      <Text style={styles.subtitle}>
        The deck engine is in the next sprint. For now, your intent has been set and the session
        has started.
      </Text>

      <Button
        variant="secondary"
        label="Change Intent"
        style={styles.button}
        onPress={() => router.back()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:              1,
    backgroundColor:   colors.light.bgBase,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: space[8],
    gap:               space[4],
  },

  pill: {
    backgroundColor:   colors.light.accentPrimary,
    borderRadius:      radius.full,
    paddingVertical:   space[1],
    paddingHorizontal: space[4],
    marginBottom:      space[2],
  },

  pillText: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
    letterSpacing: 0.5,
  },

  title: {
    fontSize:     fontSize.xl,
    fontFamily:   fontFamily.loraBold,
    color:        colors.light.textPrimary,
    textAlign:    'center',
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      colors.light.textSecondary,
    textAlign:  'center',
    lineHeight: 24,
  },

  button: {
    marginTop:  space[4],
    alignSelf:  'stretch',
  },
})
