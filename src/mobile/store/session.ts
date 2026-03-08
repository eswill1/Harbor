import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

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
  setIntent:     (intent: IntentId) => Promise<void>
}

const LAST_INTENT_KEY = 'harbor_last_intent'

export const useSessionStore = create<SessionState>((set) => ({
  currentIntent: null,
  lastIntent:    null,
  civicOptedIn:  false,

  setIntent: async (intent) => {
    set({ currentIntent: intent, lastIntent: intent })
    await SecureStore.setItemAsync(LAST_INTENT_KEY, intent)
  },
}))

export async function loadLastIntent(): Promise<IntentId | null> {
  const raw = await SecureStore.getItemAsync(LAST_INTENT_KEY)
  if (raw) {
    useSessionStore.setState({ lastIntent: raw as IntentId })
    return raw as IntentId
  }
  return null
}
