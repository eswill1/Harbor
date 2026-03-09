'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { deckApi, ApiError } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { useSessionStore, type IntentId } from '../../../store/session'

const INTENTS: {
  id:          IntentId
  label:       string
  description: string
  icon:        React.ReactNode
}[] = [
  {
    id: 'catch_up',
    label: 'Catch Up',
    description: 'Friends, updates, what you missed',
    icon: (
      <svg width="28" height="28" viewBox="0 0 256 256" fill="none">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"
              fill="currentColor"/>
        <path d="M128,72v56l32,32" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'learn',
    label: 'Learn',
    description: 'Guides, explainers, long reads',
    icon: (
      <svg width="28" height="28" viewBox="0 0 256 256" fill="none">
        <path d="M218.42,50.42l-128,128a8,8,0,0,1-11.32,0l-40-40a8,8,0,0,1,11.32-11.32L84,161.37,207.1,38.26a8,8,0,1,1,11.32,11.32Z"
              fill="currentColor" opacity="0"/>
        <rect x="32" y="48" width="80" height="96" rx="8" stroke="currentColor" strokeWidth="14" fill="none"/>
        <rect x="144" y="48" width="80" height="96" rx="8" stroke="currentColor" strokeWidth="14" fill="none"/>
        <line x1="32" y1="184" x2="224" y2="184" stroke="currentColor" strokeWidth="14" strokeLinecap="round"/>
        <line x1="80" y1="208" x2="176" y2="208" stroke="currentColor" strokeWidth="14" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'connect',
    label: 'Connect',
    description: 'Communities, events, conversations',
    icon: (
      <svg width="28" height="28" viewBox="0 0 256 256" fill="none">
        <circle cx="80" cy="128" r="40" stroke="currentColor" strokeWidth="14" fill="none"/>
        <circle cx="176" cy="80" r="40" stroke="currentColor" strokeWidth="14" fill="none"/>
        <circle cx="176" cy="176" r="40" stroke="currentColor" strokeWidth="14" fill="none"/>
        <line x1="116" y1="112" x2="140" y2="96" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
        <line x1="116" y1="144" x2="140" y2="160" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'create',
    label: 'Create',
    description: 'Collabs, prompts, get feedback',
    icon: (
      <svg width="28" height="28" viewBox="0 0 256 256" fill="none">
        <path d="M92,216H48a8,8,0,0,1-8-8V164a8,8,0,0,1,2.34-5.66l120-120a8,8,0,0,1,11.32,0l44,44a8,8,0,0,1,0,11.32Z"
              stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <line x1="136" y1="64" x2="192" y2="120" stroke="currentColor" strokeWidth="14" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'delight',
    label: 'Delight',
    description: 'Humor, art, something good',
    icon: (
      <svg width="28" height="28" viewBox="0 0 256 256" fill="none">
        <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" fill="currentColor"/>
        <circle cx="92" cy="108" r="10" fill="currentColor"/>
        <circle cx="164" cy="108" r="10" fill="currentColor"/>
        <path d="M88,152s16,24,40,24,40-24,40-24" stroke="currentColor" strokeWidth="14" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'explore',
    label: 'Explore',
    description: 'Find new creators and communities',
    icon: (
      <svg width="28" height="28" viewBox="0 0 256 256" fill="none">
        <circle cx="128" cy="128" r="96" stroke="currentColor" strokeWidth="14" fill="none"/>
        <polygon points="112,80 176,128 112,176 112,80" stroke="currentColor" strokeWidth="12" fill="currentColor" opacity="0.4"/>
        <path d="M160,96 L96,160 M96,96 L160,160" stroke="none"/>
        <path d="M170,74 L186,170 L98,138 Z" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  },
]

export default function HomePage() {
  const router                       = useRouter()
  const { accessToken }              = useAuthStore()
  const { lastIntent, setIntent, setDeck } = useSessionStore()
  const [selected, setSelected]      = useState<IntentId | null>(lastIntent)
  const [error, setError]            = useState('')

  const { mutate: startDeck, isPending } = useMutation({
    mutationFn: async (intent: IntentId) => {
      if (!accessToken) throw new Error('Not authenticated')
      return deckApi.create(intent, accessToken)
    },
    onSuccess: (data, intent) => {
      setIntent(intent)
      setDeck(data.session_id, data.cards)
      router.push('/deck')
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not load deck. Try again.')
    },
  })

  function handleConfirm() {
    if (!selected) return
    setError('')
    startDeck(selected)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        What are you here for?
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Choose an intent and we'll build your 20-card deck.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {INTENTS.map(({ id, label, description, icon }) => {
          const isSelected = selected === id
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className="flex items-start gap-4 p-4 rounded-xl text-left transition-all"
              style={{
                background: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border)'}`,
                color: isSelected ? '#fff' : 'var(--text-primary)',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <span style={{ color: isSelected ? '#fff' : 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }}>
                {icon}
              </span>
              <div>
                <div className="font-semibold text-base">{label}</div>
                <div className="text-sm mt-0.5" style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>
                  {description}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-sm mb-4" style={{ color: 'var(--accent-caution)' }}>{error}</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={!selected || isPending}
        className="w-full rounded-xl py-3 font-semibold text-sm transition-opacity disabled:opacity-40"
        style={{ background: 'var(--accent-primary)', color: '#fff' }}
      >
        {isPending ? 'Building your deck…' : 'Start deck'}
      </button>
    </div>
  )
}
