'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { deckApi, shelvesApi, shareApi, type DeckCard, type LinkPreview } from '../../../lib/api'
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

// ─── Link preview card ────────────────────────────────────────────────────────

function WebLinkPreviewCard({ preview }: { preview: LinkPreview }) {
  const displayDomain = (() => {
    try { return new URL(preview.canonical_url ?? preview.url).hostname.replace(/^www\./, '') }
    catch { return preview.site_name ?? '' }
  })()

  const dest = preview.canonical_url ?? preview.url

  if (preview.is_youtube && preview.youtube_id) {
    const thumb = preview.image_url ?? `https://img.youtube.com/vi/${preview.youtube_id}/hqdefault.jpg`
    return (
      <a href={dest} target="_blank" rel="noopener noreferrer" className="block no-underline mt-3"
         style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(255,0,0,0.85)', borderRadius: 20,
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 256 256" fill="#fff"><polygon points="240,128 80,32 80,224"/></svg>
          </div>
        </div>
        <div style={{ padding: '10px 14px 12px' }}>
          <span style={{
            display: 'inline-block', background: '#FF0000', color: '#fff',
            fontSize: 10, fontWeight: 700, borderRadius: 3, padding: '2px 6px',
            letterSpacing: 0.3, marginBottom: 4,
          }}>YouTube</span>
          {preview.title && (
            <p className="text-sm font-semibold leading-snug line-clamp-2"
               style={{ color: 'var(--text-primary)', marginTop: 2 }}>{preview.title}</p>
          )}
        </div>
      </a>
    )
  }

  return (
    <a href={dest} target="_blank" rel="noopener noreferrer" className="block no-underline mt-3"
       style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      {preview.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ padding: '10px 14px 12px' }}>
        {displayDomain && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
            {displayDomain}
          </p>
        )}
        {preview.title && (
          <p className="text-sm font-semibold leading-snug line-clamp-2"
             style={{ color: 'var(--text-primary)' }}>{preview.title}</p>
        )}
        {preview.description && (
          <p className="text-xs leading-relaxed line-clamp-2 mt-1"
             style={{ color: 'var(--text-secondary)' }}>{preview.description}</p>
        )}
      </div>
    </a>
  )
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

// Broadcast Pause: friction lives at the amplification moment, not on the card.
// reason is forward-compatible — currently only 'high_arousal' triggers the pause flow.
function SharePanel({ card, onClose }: { card: DeckCard; onClose: () => void }) {
  const { accessToken } = useAuthStore()
  const isHighArousal   = card.arousal_band === 'high'
  const isStub          = card.id === STUB_ID

  const [view, setView]         = useState<'options' | 'add_note'>('options')
  const [note, setNote]         = useState('')
  const [noteLink, setNoteLink] = useState('')
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    setView('options'); setNote(''); setNoteLink(''); setCopied(false)
  }, [card.id])

  const logShare = (type: 'friend' | 'group' | 'copy_link') => {
    if (isStub || !accessToken) return
    shareApi.log(card.id, type, accessToken).catch(() => {})
  }

  const handleBroadcast = async () => {
    logShare('copy_link')
    try {
      await navigator.clipboard.writeText(`${POST_BASE_URL}/${card.id}`)
      setCopied(true)
      setTimeout(onClose, 900)
    } catch { onClose() }
  }

  const handleShareWithNote = async () => {
    logShare('copy_link')
    const parts = [note.trim(), `${POST_BASE_URL}/${card.id}`, noteLink.trim()].filter(Boolean)
    try {
      await navigator.clipboard.writeText(parts.join('\n\n'))
      setCopied(true)
      setTimeout(onClose, 900)
    } catch { onClose() }
  }

  const CloseBtn = () => (
    <button onClick={onClose} style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
      <svg width="20" height="20" viewBox="0 0 256 256">
        <line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
        <line x1="56" y1="56" x2="200" y2="200" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
      </svg>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.5)' }}
         onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl md:rounded-2xl p-6 flex flex-col gap-4"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
           onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-2">
          {view === 'add_note' && (
            <button onClick={() => setView('options')}
                    className="text-sm font-medium flex-shrink-0"
                    style={{ color: 'var(--text-primary)' }}>
              ← Back
            </button>
          )}
          <h2 className="flex-1 font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            {view === 'add_note' ? 'Add a note' : 'Share'}
          </h2>
          <CloseBtn />
        </div>

        {view === 'options' ? (
          isHighArousal ? (
            // Broadcast Pause flow
            <>
              <div className="rounded-xl px-4 py-3 flex flex-col gap-1"
                   style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Pause before broadcasting
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Broadcast sharing of this type of content often increases conflict. Consider sharing privately or adding context.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { logShare('friend'); onClose() }}
                  className="w-full rounded-xl px-4 py-3 text-left"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--accent-primary)', cursor: 'pointer' }}
                >
                  <div className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Share privately</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Direct message — coming soon</div>
                </button>
                <button
                  onClick={() => setView('add_note')}
                  className="w-full rounded-xl px-4 py-3 text-left"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Add a note</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Share with your own context</div>
                </button>
                <button
                  onClick={isStub ? undefined : handleBroadcast}
                  className="w-full rounded-xl px-4 py-3 text-left"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', opacity: isStub ? 0.45 : 1, cursor: isStub ? 'not-allowed' : 'pointer' }}
                >
                  <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    {copied ? 'Copied!' : 'Broadcast anyway'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Share without adding context</div>
                </button>
              </div>
            </>
          ) : (
            // Normal share flow
            <div className="flex flex-col gap-2">
              {[
                { label: 'Share with a friend',              sub: 'Direct messaging — coming soon', disabled: true,  onClick: () => { logShare('friend'); onClose() } },
                { label: 'Share to a group',                 sub: 'Group sharing — coming soon',    disabled: true,  onClick: () => { logShare('group');  onClose() } },
                { label: copied ? 'Copied!' : 'Copy link',  sub: 'Share anywhere',                 disabled: false, onClick: handleBroadcast },
              ].map(({ label, sub, disabled, onClick }) => (
                <button
                  key={label}
                  onClick={disabled ? undefined : onClick}
                  className="w-full rounded-xl px-4 py-3 text-left transition-opacity"
                  style={{
                    background: 'var(--bg-elevated)',
                    border:     '1px solid var(--border)',
                    opacity:    disabled ? 0.45 : 1,
                    cursor:     disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div className="text-sm font-medium" style={{ color: disabled ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>
                </button>
              ))}
            </div>
          )
        ) : (
          // Add a note view
          <>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border:     '1px solid var(--border)',
                color:      'var(--text-primary)',
                minHeight:  '80px',
              }}
              placeholder="What's your take on this?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={280}
              autoFocus
            />
            <input
              type="url"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border:     '1px solid var(--border)',
                color:      'var(--text-primary)',
              }}
              placeholder="Add another source (optional)"
              value={noteLink}
              onChange={(e) => setNoteLink(e.target.value)}
            />
            <button
              onClick={note.trim() ? handleShareWithNote : undefined}
              className="w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity"
              style={{
                background: 'var(--accent-primary)',
                color:      '#fff',
                opacity:    note.trim() ? 1 : 0.45,
                cursor:     note.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {copied ? 'Copied with note!' : 'Share with note'}
            </button>
          </>
        )}
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
  const [satisfaction, setSatisfaction]     = useState<1 | 2 | 3 | null>(null)
  const [regretPrompted, setRegretPrompted] = useState(false)
  const [regret, setRegret]                 = useState<1 | 2 | 3 | null>(null)

  const { mutate: complete } = useMutation({
    mutationFn: (value: 1 | 2 | 3) => {
      if (!accessToken || !sessionId) throw new Error()
      return deckApi.complete(sessionId, value, accessToken)
    },
    onSuccess: (data) => {
      if (data.regret_prompted) setRegretPrompted(true)
    },
  })

  const { mutate: submitRegret } = useMutation({
    mutationFn: (value: 1 | 2 | 3) => {
      if (!accessToken || !sessionId) throw new Error()
      return deckApi.submitRegret(sessionId, value, accessToken)
    },
  })

  const handleSatisfaction = (value: 1 | 2 | 3) => {
    if (satisfaction !== null) return
    setSatisfaction(value)
    complete(value)
  }

  const handleRegret = (value: 1 | 2 | 3) => {
    if (regret !== null) return
    setRegret(value)
    submitRegret(value)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 gap-6">
      <svg width="48" height="48" viewBox="0 0 256 256" fill="none" style={{ color: 'var(--accent-primary)' }}>
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" fill="currentColor" opacity="0.2"/>
        <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" fill="currentColor"/>
      </svg>

      <div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {"You're caught up."}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          That was your 20-card deck.
        </p>
      </div>

      {/* ── Satisfaction ── */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {satisfaction !== null ? 'Thanks for the feedback.' : 'Did you get what you came for?'}
        </p>
        <div className="flex gap-4">
          {([
            { emoji: '😊', value: 1 as const },
            { emoji: '😐', value: 2 as const },
            { emoji: '😞', value: 3 as const },
          ]).map(({ emoji, value }) => {
            const isChosen = satisfaction === value
            return (
              <button key={value} onClick={() => handleSatisfaction(value)}
                      disabled={satisfaction !== null}
                      style={{
                        width: 64, height: 64, borderRadius: 32,
                        fontSize: isChosen ? 36 : 32,
                        background: isChosen ? 'var(--accent-primary)22' : 'var(--bg-elevated)',
                        border: isChosen ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                        opacity: satisfaction !== null && !isChosen ? 0.3 : 1,
                        cursor: satisfaction !== null ? 'default' : 'pointer',
                        transition: 'all 0.15s',
                      }}>
                {emoji}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Regret prompt (cohort only) ── */}
      {satisfaction !== null && regretPrompted && (
        <div className="w-full max-w-sm flex flex-col items-center gap-3">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {regret !== null ? 'Noted — thank you.' : 'Did you regret reading anything?'}
          </p>
          <div className="flex gap-4">
            {([
              { emoji: '👍', value: 1 as const },
              { emoji: '🤔', value: 2 as const },
              { emoji: '😬', value: 3 as const },
            ]).map(({ emoji, value }) => {
              const isChosen = regret === value
              return (
                <button key={value} onClick={() => handleRegret(value)}
                        disabled={regret !== null}
                        style={{
                          width: 64, height: 64, borderRadius: 32,
                          fontSize: isChosen ? 36 : 32,
                          background: isChosen ? 'var(--accent-primary)22' : 'var(--bg-elevated)',
                          border: isChosen ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                          opacity: regret !== null && !isChosen ? 0.3 : 1,
                          cursor: regret !== null ? 'default' : 'pointer',
                          transition: 'all 0.15s',
                        }}>
                  {emoji}
                </button>
              )
            })}
          </div>
        </div>
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
             style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>

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
            {card.link_preview && (
              <WebLinkPreviewCard preview={card.link_preview} />
            )}
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
