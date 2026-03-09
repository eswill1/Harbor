import { useState, useEffect, useRef, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Anchor,
  Book,
  Users,
  PencilLine,
  Sparkle,
  Compass,
  Landmark,
} from 'phosphor-react-native'
import { router } from 'expo-router'

import { colors, fontSize, fontFamily, space, radius, shadow, duration } from '../../constants/tokens'
import { Button } from '../../components/ui/Button'
import { useSessionStore, loadLastIntent, type IntentId } from '../../store/session'
import { useAuthStore } from '../../store/auth'
import { deckApi } from '../../lib/api'
import { useTheme } from '../../hooks/useTheme'

const SCREEN_WIDTH = Dimensions.get('window').width
const CARD_GAP     = space[3]
const H_PADDING    = space[4]
const CARD_WIDTH   = (SCREEN_WIDTH - H_PADDING * 2 - CARD_GAP) / 2

const INTENTS = [
  {
    id:          'catch_up' as IntentId,
    label:       'Catch Up',
    description: 'Friends, updates, what you missed',
    Icon:        Anchor,
  },
  {
    id:          'learn' as IntentId,
    label:       'Learn',
    description: 'Guides, explainers, long reads',
    Icon:        Book,
  },
  {
    id:          'connect' as IntentId,
    label:       'Connect',
    description: 'Communities, events, conversations',
    Icon:        Users,
  },
  {
    id:          'create' as IntentId,
    label:       'Create',
    description: 'Collabs, prompts, get feedback',
    Icon:        PencilLine,
  },
  {
    id:          'delight' as IntentId,
    label:       'Delight',
    description: 'Humor, art, something good',
    Icon:        Sparkle,
  },
  {
    id:          'explore' as IntentId,
    label:       'Explore',
    description: 'Find new creators and communities',
    Icon:        Compass,
  },
  {
    id:          'civic' as IntentId,
    label:       'Civic',
    description: 'News and civic discussion',
    Icon:        Landmark,
    optIn:       true,
  },
] as const

export default function IntentSelectorScreen() {
  const insets         = useSafeAreaInsets()
  const { lastIntent, civicOptedIn, setIntent, setDeck } = useSessionStore()
  const accessToken    = useAuthStore((s) => s.accessToken)
  const [selected, setSelected] = useState<IntentId | null>(null)
  const [loading, setLoading]   = useState(false)
  const fadeAnim       = useRef(new Animated.Value(0)).current
  const theme          = useTheme()
  const styles         = useMemo(() => makeStyles(theme), [theme])

  // Load last intent and pre-select it
  useEffect(() => {
    loadLastIntent().then((last) => {
      if (last) setSelected(last)
    })
  }, [])

  // Fade the screen in on mount (600ms — xslow per Design Bible)
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:         1,
      duration:        duration.xslow,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim])

  const visibleIntents = INTENTS.filter((i) => !i.optIn || civicOptedIn)

  const handleStart = async () => {
    if (!selected || !accessToken) return
    setLoading(true)
    try {
      await setIntent(selected)
      const deck = await deckApi.create(selected, accessToken)
      setDeck(deck.session_id, deck.cards)
      router.push('/(app)/deck')
    } catch {
      Alert.alert('Error', 'Could not load your deck. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <FlatList
        data={visibleIntents}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + space[6] },
        ]}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>What are you{'\n'}here for?</Text>
            <Text style={styles.subheading}>
              Choose your intent. Harbor builds your deck around it.
            </Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 120 }} />}
        renderItem={({ item }) => {
          const isSelected = selected === item.id
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
              onPress={() => setSelected(item.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${item.label}: ${item.description}`}
            >
              <item.Icon
                size={32}
                weight={isSelected ? 'fill' : 'regular'}
                color={isSelected ? '#fff' : theme.accentPrimary}
              />
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                {item.label}
              </Text>
              <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>
                {item.description}
              </Text>
            </Pressable>
          )
        }}
      />

      {/* Sticky CTA */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + space[4] },
        ]}
      >
        <Button
          label="Start Session"
          disabled={!selected}
          loading={loading}
          onPress={handleStart}
        />
      </View>
    </Animated.View>
  )
}

const makeStyles = (c: typeof colors.light) => StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: c.bgBase,
  },

  listContent: {
    paddingHorizontal: H_PADDING,
    gap:               CARD_GAP,
  },

  row: {
    gap: CARD_GAP,
  },

  header: {
    marginBottom: space[6],
    gap:          space[2],
  },

  heading: {
    fontSize:     fontSize['2xl'],
    fontFamily:   fontFamily.loraBold,
    color:        c.textPrimary,
    letterSpacing: -0.5,
    lineHeight:   36,
  },

  subheading: {
    fontSize:   fontSize.base,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
    lineHeight: 22,
  },

  card: {
    width:           CARD_WIDTH,
    backgroundColor: c.bgSurface,
    borderRadius:    radius.xl,
    borderWidth:     1.5,
    borderColor:     c.border,
    padding:         space[4],
    gap:             space[2],
    ...shadow.sm,
  },

  cardSelected: {
    backgroundColor: c.accentPrimary,
    borderColor:     c.accentPrimary,
    transform:       [{ scale: 1.02 }],
  },

  cardPressed: {
    opacity: 0.85,
  },

  cardLabel: {
    fontSize:   fontSize.md,
    fontFamily: fontFamily.interBold,
    color:      c.textPrimary,
    letterSpacing: -0.2,
  },

  cardLabelSelected: {
    color: '#fff',
  },

  cardDesc: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
    lineHeight: 18,
  },

  cardDescSelected: {
    color: 'rgba(255,255,255,0.8)',
  },

  footer: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    paddingHorizontal: H_PADDING,
    paddingTop:      space[4],
    backgroundColor: c.bgBase,
    borderTopWidth:  1,
    borderTopColor:  c.border,
  },
})
