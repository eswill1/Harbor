'use client'

import { useQuery } from '@tanstack/react-query'
import { adminApi, usersApi, type AdminSummary, type RollbackEvent } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, suffix = ''): string {
  if (n === null || n === undefined) return '—'
  return `${n}${suffix}`
}

function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value24h,
  value7d,
  suffix = '',
  threshold,
  thresholdLabel,
  invert = false,
}: {
  label:          string
  value24h:       number | null
  value7d?:       number | null
  suffix?:        string
  threshold?:     number
  thresholdLabel?: string
  invert?:        boolean   // true = lower is better (RR), false = higher is better (SSR)
}) {
  const atRisk = threshold !== undefined && value24h !== null && (
    invert ? value24h >= threshold : value24h < threshold
  )

  return (
    <div className="rounded-xl p-5 flex flex-col gap-2"
         style={{ background: 'var(--bg-surface)', border: `1px solid ${atRisk ? 'var(--accent-caution)' : 'var(--border)'}` }}>
      <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>

      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold tabular-nums"
              style={{ color: atRisk ? 'var(--accent-caution)' : 'var(--text-primary)' }}>
          {fmt(value24h, suffix)}
        </span>
        {value7d !== undefined && (
          <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
            {fmt(value7d, suffix)} / 7d
          </span>
        )}
      </div>

      {threshold !== undefined && (
        <div className="text-xs" style={{ color: atRisk ? 'var(--accent-caution)' : 'var(--text-muted)' }}>
          {thresholdLabel ?? `Target: ${invert ? '<' : '>'} ${threshold}${suffix}`}
          {atRisk ? ' ⚠' : ' ✓'}
        </div>
      )}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest mt-8 mb-3"
        style={{ color: 'var(--text-muted)' }}>
      {children}
    </h2>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3"
         style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="text-sm font-medium tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { accessToken } = useAuthStore()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn:  () => usersApi.me(accessToken!),
    enabled:  !!accessToken,
  })

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['admin-summary'],
    queryFn:  () => adminApi.summary(accessToken!),
    enabled:  !!accessToken && me?.role === 'admin',
    refetchInterval: 60_000,
  })

  const { data: rollbacks = [] } = useQuery({
    queryKey: ['admin-rollbacks'],
    queryFn:  () => adminApi.rollbackEvents(accessToken!),
    enabled:  !!accessToken && me?.role === 'admin',
  })

  // ── Access control ───────────────────────────────────────────────────────

  if (me && me.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Access denied</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Admin access required.</p>
      </div>
    )
  }

  if (!me || summaryLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center" style={{ color: 'var(--text-muted)' }}>
        Loading…
      </div>
    )
  }

  if (summaryError || !summary) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-sm" style={{ color: 'var(--accent-caution)' }}>Failed to load metrics.</p>
      </div>
    )
  }

  const s = summary

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Metrics</h1>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Updated {relativeTime(s.generated_at)}
        </span>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Config <span className="font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>
          v{s.ranking_config.version}
        </span> active · 24h window unless noted
      </p>

      {/* ── North star ── */}
      <SectionHeading>North Star</SectionHeading>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Satisfied Session Rate"
          value24h={s.ssr.pct_24h}
          value7d={s.ssr.pct_7d}
          suffix="%"
          threshold={s.ssr.threshold_pct}
          thresholdLabel={`Target > ${s.ssr.threshold_pct}%`}
        />
        <StatCard
          label="Sessions (started)"
          value24h={s.sessions.total_24h}
          value7d={s.sessions.total_7d}
        />
      </div>
      <div className="mt-3 rounded-xl px-4 py-3 text-xs"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        {s.ssr.responded_24h} responses (24h) · {s.ssr.responded_7d} responses (7d) ·{' '}
        {s.sessions.total_24h > 0
          ? `${Math.round(s.sessions.completed_24h / s.sessions.total_24h * 100)}% completion rate (24h)`
          : 'no sessions (24h)'}
      </div>

      {/* ── Safety ── */}
      <SectionHeading>Safety</SectionHeading>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={`Regret Rate (${s.regret_rate.window_hours}h window)`}
          value24h={s.regret_rate.pct}
          suffix="%"
          threshold={s.regret_rate.threshold_pct}
          thresholdLabel={`Rollback at ≥ ${s.regret_rate.threshold_pct}%`}
          invert
        />
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
            Regret Sample
          </div>
          <div className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between">
              <span>Prompted</span>
              <span className="tabular-nums font-medium">{s.regret_rate.total_prompted}</span>
            </div>
            <div className="flex justify-between">
              <span>Responded</span>
              <span className="tabular-nums font-medium">{s.regret_rate.total_responded}</span>
            </div>
            <div className="flex justify-between" style={{ color: 'var(--text-muted)' }}>
              <span>Response rate</span>
              <span className="tabular-nums">
                {s.regret_rate.total_prompted > 0
                  ? `${Math.round(s.regret_rate.total_responded / s.regret_rate.total_prompted * 100)}%`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rollback events */}
      {rollbacks.length > 0 && (
        <div className="mt-3 rounded-xl overflow-hidden"
             style={{ border: '1px solid var(--accent-caution)' }}>
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide"
               style={{ background: 'color-mix(in srgb, var(--accent-caution) 10%, transparent)', color: 'var(--accent-caution)' }}>
            Auto-rollback history
          </div>
          {rollbacks.slice(0, 5).map((e: RollbackEvent) => (
            <div key={e.id} className="px-4 py-3 flex items-center justify-between text-sm"
                 style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <div>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {e.trigger_metric}
                </span>
                <span className="ml-2" style={{ color: 'var(--text-muted)' }}>
                  {e.metric_value}% · v{e.from_version} → v{e.to_version}
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {relativeTime(e.triggered_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Activity ── */}
      <SectionHeading>Activity</SectionHeading>
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Posts"      value24h={s.content.posts_24h} value7d={s.content.posts_7d} />
        <StatCard label="New users"  value24h={s.users.new_24h}     value7d={s.users.new_7d} />
        <StatCard label="Deck sessions" value24h={s.sessions.total_24h} value7d={s.sessions.total_7d} />
      </div>

      {/* ── Moderation queue ── */}
      <SectionHeading>Moderation Queue</SectionHeading>
      <div className="rounded-xl overflow-hidden"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between py-3 px-4"
             style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pending reports</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium tabular-nums"
                  style={{ color: s.moderation.pending_reports > 0 ? 'var(--accent-caution)' : 'var(--text-primary)' }}>
              {s.moderation.pending_reports}
            </span>
            <a href="/admin/reports"
               className="text-xs font-medium"
               style={{ color: 'var(--accent-primary)' }}>
              Review →
            </a>
          </div>
        </div>
        <div className="flex items-center justify-between py-3 px-4">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pending appeals</span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium tabular-nums"
                  style={{ color: s.moderation.pending_appeals > 0 ? 'var(--accent-caution)' : 'var(--text-primary)' }}>
              {s.moderation.pending_appeals}
            </span>
            <a href="/admin/appeals"
               className="text-xs font-medium"
               style={{ color: 'var(--accent-primary)' }}>
              Review →
            </a>
          </div>
        </div>
      </div>

    </div>
  )
}
