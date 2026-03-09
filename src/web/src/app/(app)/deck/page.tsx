'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { deckApi, shelvesApi, shareApi, type DeckCard } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { useSessionStore } from '../../../store/session'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const BUCKET_LABELS: Record<DeckCard['source_bucket'], string> = {
  friends:   'From your friends',
  groups:    'From your groups',
  shelves:   'From your shelves',
  discovery: 'Adjacent discovery',
}

const INTENT_LABELS: Record<string, string> = {
  catch_up: 'Catch Up',
  learn:    'Learn',
  connect:  'Connect',
  create:   'Create',
  delight:  'Delight',
  explore:  'Explore',
  civic:    'Civic',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ─── Why This panel ───────────────────────────────────────────────────────────

function WhyThisPanel({ card, onClose }: { card: DeckCard; onClose: () => void }) {
  const bucketLabel = BUCKET_LABELS[card.source_bucket]
  const reasons = [
    `Source: ${bucketLabel}`,
    card.is_serendipity
      ? 'This is a discovery pick — adjacent to your interests, within your 15% discovery budget.'
      : null,
    card.arousal_band === 'high'
      ? 'This content is trending for strong reactions.'
      : null,
  ].filter(Boolean) as string[]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.5)' }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl p-6"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Why you're seeing this
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 256 256">
              <line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
              <line x1="56" y1="56" x2="200" y2="200" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <p className="text-sm mb-4 italic" style={{ color: 'var(--text-secondary)' }}>
          {card.content.slice(0, 80)}{card.content.length > 80 ? '…' : ''}
        </p>
        <ul className="flex flex-col gap-2">
          {reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>·</span>
              {r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Save to shelf panel ───────────────────────────────────────────────────────

function SavePanel({ card, onClose }: { card: DeckCard; onClose: () => void }) {
  const { accessToken } = useAuthStore()
  const qc = useQueryClient()
  const { data: shelves = [] } = useQuery({
    queryKey: ['shelves'],
    queryFn:  () => shelvesApi.list(accessToken!),
    enabled:  !!accessToken,
  })
  const [saved, setSaved] = useState<string | null>(null)

  async function handleSave(shelfId: string) {
    if (!accessToken) return
    await shelvesApi.saveItem(shelfId, card.id, accessToken).catch(() => {})
    setSaved(shelfId)
    qc.invalidateQueries({ queryKey: ['shelves'] })
    setTimeout(onClose, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.5)' }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl p-6"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Save to shelf
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 256 256">
              <line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
              <line x1="56" y1="56" x2="200" y2="200" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {shelves.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No shelves yet. Create one from the Shelves tab.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shelves.map((shelf) => (
              <li key={shelf.id}>
                <button
                  onClick={() => handleSave(shelf.id)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-left transition-colors"
                  style={{
                    background: saved === shelf.id ? 'var(--accent-success)' : 'var(--bg-elevated)',
                    color: saved === shelf.id ? '#fff' : 'var(--text-primary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <span className="font-medium">{shelf.name}</span>
                  <span style={{ color: saved === shelf.id ? '#fff' : 'var(--text-muted)' }}>
                    {shelf.item_count} saved
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Share panel ──────────────────────────────────────────────────────────────

const POST_BASE_URL = 'https://dev.joinharbor.app/posts'
const STUB_ID       = '00000000-0000-0000-0000-000000000000'

function SharePanel({ card, onClose }: { card: DeckCard; onClose: () => void }) {
  const { accessToken } = useAuthStore()
  const isHighArousal   = card.arousal_band === 'high'
  const isStub          = card.id === STUB_ID

  const [frozenSecs, setFrozenSecs] = useState(isHighArousal ? 3 : 0)
  const [copied, setCopied]         = useState(false)

  useEffect(() => {
    setFrozenSecs(isHighArousal ? 3 : 0)
    setCopied(false)
  }, [card.id, isHighArousal])

  useEffect(() => {
    if (frozenSecs <= 0) return
    const t = setTimeout(() => setFrozenSecs((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [frozenSecs])

  const logShare = (type: 'friend' | 'group' | 'copy_link') => {
    if (isStub || !accessToken) return
    shareApi.log(card.id, type, accessToken).catch(() => {})
  }

  const frozen = frozenSecs > 0

  const options = [
    {
      label:    'Share with a friend',
      sub:      'Direct messaging — coming soon',
      isStub:   true,
      onClick:  () => { logShare('friend'); onClose() },
    },
    {
      label:    'Share to a group',
      sub:      'Group sharing — coming soon',
      isStub:   true,
      onClick:  () => { logShare('group'); onClose() },
    },
    {
      label:    copied ? 'Link copied!' : 'Copy link',
      sub:      'Share anywhere',
      isStub:   false,
      onClick:  async () => {
        logShare('copy_link')
        try {
          await navigator.clipboard.writeText(`${POST_BASE_URL}/${card.id}`)
          setCopied(true)
          setTimeout(onClose, 900)
        } catch {
          onClose()
        }
      },
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.5)' }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl p-6 flex flex-col gap-4"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
           onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Share
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <svg width="20" height="20" viewBox="0 0 256 256">
              <line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
              <line x1="56" y1="56" x2="200" y2="200" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* High-arousal friction */}
        {isHighArousal && (
          <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm"
               style={{ background: 'rgba(196,147,90,0.1)', color: 'var(--accent-caution)' }}>
            <span>This is getting strong reactions — read before sharing.</span>
            {frozen && (
              <span className="font-bold text-base w-6 text-center flex-shrink-0">{frozenSecs}</span>
            )}
          </div>
        )}

        {/* Options */}
        <div className="flex flex-col gap-2">
          {options.map(({ label, sub, isStub: optionIsStub, onClick }) => {
            const disabled = frozen || optionIsStub
            return (
              <button
                key={label}
                onClick={disabled ? undefined : onClick}
                className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-left transition-opacity"
                style={{
                  background: 'var(--bg-elevated)',
                  border:     '1px solid var(--border)',
                  opacity:    disabled ? 0.45 : 1,
                  cursor:     disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: optionIsStub ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {sub}
                  </div>
                </div>
                {frozen && !optionIsStub && (
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--accent-caution)' }}>
                    wait {frozenSecs}s
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Deck completion screen ────────────────────────────────────────────────────

function DeckComplete({
  sessionId,
  onRestart,
}: {
  sessionId: string
  onRestart: () => void
}) {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [submitted, setSubmitted] = useState(false)

  const { mutate: complete } = useMutation({
    mutationFn: (satisfaction: 1 | 2 | 3) => {
      if (!accessToken || !sessionId) throw new Error()
      return deckApi.complete(sessionId, satisfaction, accessToken)
    },
    onSuccess: () => setSubmitted(true),
  })

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 gap-6">
      <svg width="48" height="48" viewBox="0 0 256 256" fill="none" style={{ color: 'var(--accent-primary)' }}>
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" fill="currentColor" opacity="0.2"/>
        <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" fill="currentColor"/>
      </svg>

      <div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          You're caught up.
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          That was your 20-card deck.
        </p>
      </div>

      {!submitted ? (
        <div className="w-full max-w-sm">
          <p className="text-sm mb-3 font-medium" style={{ color: 'var(--text-primary)' }}>
            Did you get what you came for?
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => complete(1)}
                    className="w-full py-3 rounded-xl font-semibold text-sm"
                    style={{ background: 'var(--accent-primary)', color: '#fff' }}>
              Yes, I'm done
            </button>
            <button onClick={() => complete(2)}
                    className="w-full py-3 rounded-xl text-sm"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              Sort of
            </button>
            <button onClick={() => complete(3)}
                    className="w-full py-3 rounded-xl text-sm"
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
              Not really
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Thanks for the feedback.</p>
      )}

      <div className="w-full max-w-sm flex flex-col gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={onRestart}
                className="w-full py-2.5 rounded-xl text-sm"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
          Load another deck
        </button>
        <button onClick={() => router.push('/home')}
                className="w-full py-2.5 rounded-xl text-sm"
                style={{ color: 'var(--text-secondary)' }}>
          Switch intent
        </button>
        <button onClick={() => router.push('/shelves')}
                className="w-full py-2.5 rounded-xl text-sm"
                style={{ color: 'var(--text-secondary)' }}>
          Go to Shelves
        </button>
      </div>
    </div>
  )
}

// ─── Main deck view ────────────────────────────────────────────────────────────

export default function DeckPage() {
  const router = useRouter()
  const { accessToken }              = useAuthStore()
  const { currentIntent, sessionId, cards, cardIndex, advanceCard, retreatCard, setDeck } = useSessionStore()
  const [showWhy, setShowWhy]        = useState(false)
  const [showSave, setShowSave]      = useState(false)
  const [showShare, setShowShare]    = useState(false)

  const { mutate: loadNewDeck, isPending: loadingDeck } = useMutation({
    mutationFn: () => {
      if (!accessToken || !currentIntent) throw new Error()
      return deckApi.create(currentIntent, accessToken)
    },
    onSuccess: (data) => setDeck(data.session_id, data.cards),
  })

  if (!currentIntent || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No deck loaded.</p>
        <button onClick={() => router.push('/home')}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold"
                style={{ background: 'var(--accent-primary)', color: '#fff' }}>
          Choose an intent
        </button>
      </div>
    )
  }

  const isDone = cardIndex >= cards.length
  const card   = isDone ? null : cards[cardIndex]
  const total  = cards.length

  if (isDone && sessionId) {
    return (
      <DeckComplete
        sessionId={sessionId}
        onRestart={() => loadNewDeck()}
      />
    )
  }

  if (!card) return null

  const isSerendipity = card.is_serendipity
  const isHighArousal = card.arousal_band === 'high'

  return (
    <>
      {showWhy   && <WhyThisPanel card={card} onClose={() => setShowWhy(false)} />}
      {showSave  && <SavePanel    card={card} onClose={() => setShowSave(false)} />}
      {showShare && <SharePanel   card={card} onClose={() => setShowShare(false)} />}

      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Progress bar + intent label */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)' }}>
            {INTENT_LABELS[currentIntent]}
          </span>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-300"
                 style={{ width: `${((cardIndex) / total) * 100}%`, background: 'var(--accent-primary)' }} />
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {cardIndex + 1} of {total}
          </span>
        </div>

        {/* Card */}
        <div className="rounded-xl overflow-hidden"
             style={{
               background: 'var(--bg-surface)',
               border: `1px solid var(--border)`,
               borderLeft: isSerendipity || isHighArousal
                 ? `3px solid ${isHighArousal ? 'var(--accent-caution)' : 'var(--accent-primary)'}`
                 : '1px solid var(--border)',
             }}>
          {/* High arousal warning */}
          {isHighArousal && (
            <div className="px-4 pt-3 pb-2 text-xs font-medium"
                 style={{ background: 'rgba(196,147,90,0.08)', color: 'var(--accent-caution)' }}>
              This content is trending for strong reactions — read before sharing.
            </div>
          )}

          {/* Card header */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                     style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)' }}>
                  {card.creator.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {card.creator.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    @{card.creator.handle}
                  </div>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 mt-1"
                    style={{
                      background: isSerendipity ? 'rgba(74,127,165,0.12)' : 'var(--bg-elevated)',
                      color: isSerendipity ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      border: isSerendipity ? '1px solid var(--accent-primary)' : 'none',
                    }}>
                {BUCKET_LABELS[card.source_bucket]}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Content */}
          <div className="px-4 py-4">
            <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {card.content}
            </p>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)' }} />

          {/* Actions */}
          <div className="px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSave(true)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                <svg width="14" height="14" viewBox="0 0 256 256" fill="none">
                  <path d="M192,224l-64-40L64,224V48a16,16,0,0,1,16-16H176a16,16,0,0,1,16,16Z"
                        stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Save
              </button>
              <button onClick={() => setShowShare(true)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                <svg width="14" height="14" viewBox="0 0 256 256" fill="none">
                  <circle cx="168" cy="48" r="24" stroke="currentColor" strokeWidth="16"/>
                  <circle cx="40"  cy="128" r="24" stroke="currentColor" strokeWidth="16"/>
                  <circle cx="168" cy="208" r="24" stroke="currentColor" strokeWidth="16"/>
                  <line x1="63.45" y1="115.82" x2="144.55" y2="60.18" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                  <line x1="63.45" y1="140.18" x2="144.55" y2="195.82" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                </svg>
                Share
              </button>
            </div>
            <button onClick={() => setShowWhy(true)}
                    className="text-xs"
                    style={{ color: 'var(--accent-primary)' }}>
              Why this?
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4 gap-3">
          <button
            onClick={retreatCard}
            disabled={cardIndex === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-30"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            ← Previous
          </button>
          <button
            onClick={advanceCard}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}>
            {cardIndex === total - 1 ? 'Finish →' : 'Next →'}
          </button>
        </div>
      </div>
    </>
  )
}
