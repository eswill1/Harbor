import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import type { DeckCard } from '../lib/api'

export type IntentId =
  | 'catch_up'
  | 'learn'
  | 'connect'
  | 'create'
  | 'delight'
  | 'explore'
  | 'civic'

interface SessionState {
  currentIntent: IntentId | null
  lastIntent:    IntentId | null
  civicOptedIn:  boolean
  // Active deck
  sessionId:     string | null
  cards:         DeckCard[]
  cardIndex:     number
  setIntent:     (intent: IntentId) => Promise<void>
  setDeck:       (sessionId: string, cards: DeckCard[]) => void
  advanceCard:   () => void
  retreatCard:   () => void
  clearDeck:     () => void
}

const LAST_INTENT_KEY = 'harbor_last_intent'

export const useSessionStore = create<SessionState>((set) => ({
  currentIntent: null,
  lastIntent:    null,
  civicOptedIn:  false,
  sessionId:     null,
  cards:         [],
  cardIndex:     0,

  setIntent: async (intent) => {
    set({ currentIntent: intent, lastIntent: intent })
    await SecureStore.setItemAsync(LAST_INTENT_KEY, intent)
  },

  setDeck: (sessionId, cards) => set({ sessionId, cards, cardIndex: 0 }),

  advanceCard: () => set((s) => ({ cardIndex: Math.min(s.cardIndex + 1, s.cards.length - 1) })),

  retreatCard: () => set((s) => ({ cardIndex: Math.max(s.cardIndex - 1, 0) })),

  clearDeck: () => set({ sessionId: null, cards: [], cardIndex: 0 }),
}))

export async function loadLastIntent(): Promise<IntentId | null> {
  const raw = await SecureStore.getItemAsync(LAST_INTENT_KEY)
  if (raw) {
    useSessionStore.setState({ lastIntent: raw as IntentId })
    return raw as IntentId
  }
  return null
}
