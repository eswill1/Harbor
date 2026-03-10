'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, usersApi, type AdminAppeal } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/auth'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (hours < 1)  return 'less than 1h ago'
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  remove:               'Content removed',
  label:                'Content labeled',
  restrict_distribution: 'Distribution limited',
  warn:                 'Account warned',
}

// ─── Appeal row ───────────────────────────────────────────────────────────────

function AppealRow({ appeal, token }: { appeal: AdminAppeal; token: string }) {
  const qc = useQueryClient()
  const [note, setNote]       = useState('')
  const [expanded, setExpanded] = useState(false)

  const { mutate, isPending, error } = useMutation({
    mutationFn: (decision: 'uphold' | 'overturn') =>
      adminApi.patchAppeal(appeal.id, decision, note.trim() || undefined, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-appeals'] }),
  })

  return (
    <div className="rounded-xl overflow-hidden"
         style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      {/* Header */}
      <button
        className="w-full flex items-start justify-between gap-3 px-4 py-4 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              @{appeal.user.handle}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              {ACTION_TYPE_LABELS[appeal.action.action_type] ?? appeal.action.action_type}
            </span>
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {appeal.notice?.plain_summary ?? appeal.action.reason}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {relativeTime(appeal.submitted_at)}
          </p>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
            #{appeal.id.slice(0, 8)}
          </p>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3"
             style={{ borderTop: '1px solid var(--border)' }}>

          {/* Original action details */}
          <div className="mt-3">
            <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Original action
            </p>
            <div className="rounded-lg px-3 py-2 text-sm"
                 style={{ background: 'var(--bg-elevated)' }}>
              <p style={{ color: 'var(--text-primary)' }}>
                {ACTION_TYPE_LABELS[appeal.action.action_type] ?? appeal.action.action_type}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {appeal.action.reason}
              </p>
              {appeal.notice?.policy_section && (
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Policy: {appeal.notice.policy_section}
                </p>
              )}
            </div>
          </div>

          {/* Affected content excerpt */}
          {appeal.notice?.affected_excerpt && (
            <div>
              <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Affected content
              </p>
              <p className="text-sm italic px-3 py-2 rounded-lg"
                 style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                &ldquo;{appeal.notice.affected_excerpt}&rdquo;
              </p>
            </div>
          )}

          {/* Resolution note */}
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide"
                   style={{ color: 'var(--text-muted)' }}>
              Resolution note (optional — shown to user)
            </label>
            <textarea value={note}
                      onChange={e => setNote(e.target.value)}
                      rows={2}
                      placeholder="Explain the decision to the user…"
                      className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--accent-caution)' }}>
              {(error as Error).message}
            </p>
          )}

          {/* Decision buttons */}
          <div className="flex gap-2">
            <button onClick={() => mutate('overturn')}
                    disabled={isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                    style={{ background: 'var(--accent-primary)', color: '#fff' }}>
              {isPending ? 'Saving…' : 'Overturn'}
            </button>
            <button onClick={() => mutate('uphold')}
                    disabled={isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              Uphold
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppealsPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn:  () => usersApi.me(accessToken!),
    enabled:  !!accessToken,
  })

  const { data: appeals = [], isLoading } = useQuery({
    queryKey: ['admin-appeals'],
    queryFn:  () => adminApi.appeals(accessToken!),
    enabled:  !!accessToken && me?.role === 'admin',
  })

  if (me && me.role !== 'admin') {
    return <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Access denied.</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/admin')}
                className="text-sm" style={{ color: 'var(--accent-primary)' }}>
          ← Metrics
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Appeals</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : appeals.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No pending appeals.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {appeals.map(a => (
            <AppealRow key={a.id} appeal={a} token={accessToken!} />
          ))}
        </div>
      )}
    </div>
  )
}
