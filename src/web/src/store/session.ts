'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  sessionId:     string | null
  cards:         DeckCard[]
  cardIndex:     number

  setIntent:   (intent: IntentId) => void
  setDeck:     (sessionId: string, cards: DeckCard[]) => void
  advanceCard: () => void
  retreatCard: () => void
  clearDeck:   () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentIntent: null,
      lastIntent:    null,
      civicOptedIn:  false,
      sessionId:     null,
      cards:         [],
      cardIndex:     0,

      setIntent: (intent) =>
        set({ currentIntent: intent, lastIntent: intent }),

      setDeck: (sessionId, cards) =>
        set({ sessionId, cards, cardIndex: 0 }),

      advanceCard: () =>
        set((s) => ({ cardIndex: Math.min(s.cardIndex + 1, s.cards.length) })),

      retreatCard: () =>
        set((s) => ({ cardIndex: Math.max(s.cardIndex - 1, 0) })),

      clearDeck: () =>
        set({ sessionId: null, cards: [], cardIndex: 0 }),
    }),
    {
      name: 'harbor_session',
      partialize: (s) => ({
        lastIntent:   s.lastIntent,
        civicOptedIn: s.civicOptedIn,
      }),
    },
  ),
)
