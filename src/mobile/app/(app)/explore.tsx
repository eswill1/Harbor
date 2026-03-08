import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Compass } from 'phosphor-react-native'
import { colors, fontSize, fontFamily, space } from '../../constants/tokens'

export default function ExploreScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Compass size={48} color={colors.light.accentPrimary} weight="regular" />
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>
        Discover new creators and communities. Finite, curated, purposeful.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.light.bgBase,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: space[8],
    gap:             space[4],
  },
  title: {
    fontSize:     fontSize.xl,
    fontFamily:   fontFamily.interBold,
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
})
