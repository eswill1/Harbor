'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, usersApi, type AdminReport } from '../../../../lib/api'
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

// ─── Action form ─────────────────────────────────────────────────────────────

const ACTION_TYPES = ['warn', 'label', 'restrict_distribution', 'remove'] as const
const SEVERITIES   = ['LOW', 'MED', 'HIGH', 'CRITICAL'] as const
const POLICY_CODES = [
  'spam', 'harassment', 'hate_speech', 'misinformation',
  'violent_content', 'sexual_content', 'self_harm', 'impersonation', 'other',
]

function EscalateForm({
  report,
  token,
  onClose,
}: {
  report:  AdminReport
  token:   string
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    action_type:          'warn' as typeof ACTION_TYPES[number],
    reason:               '',
    policy_section:       '',
    primary_reason_code:  report.reason,
    severity:             'MED' as typeof SEVERITIES[number],
    plain_summary:        '',
    action_taken:         '',
    can_repost:           false,
    repost_instructions:  '',
    action_end:           '',
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => adminApi.actionReport(report.id, {
      ...form,
      action_end:          form.action_end || undefined,
      repost_instructions: form.repost_instructions || undefined,
    }, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] })
      onClose()
    },
  })

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Issue Enforcement Action
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Report #{report.id.slice(0, 8)} · {report.reason}
        </p>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Action type</label>
              <select value={form.action_type}
                      onChange={e => set('action_type', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Severity</label>
              <select value={form.severity}
                      onChange={e => set('severity', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Reason code</label>
            <select value={form.primary_reason_code}
                    onChange={e => set('primary_reason_code', e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              {POLICY_CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Policy section</label>
            <input value={form.policy_section}
                   onChange={e => set('policy_section', e.target.value)}
                   placeholder="e.g. §3.1 Harassment"
                   className="w-full rounded-lg px-3 py-2 text-sm"
                   style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Internal reason <span style={{ color: 'var(--accent-caution)' }}>*</span></label>
            <textarea value={form.reason}
                      onChange={e => set('reason', e.target.value)}
                      rows={2}
                      placeholder="Internal notes on why this action was taken"
                      className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>User-facing summary <span style={{ color: 'var(--accent-caution)' }}>*</span></label>
            <textarea value={form.plain_summary}
                      onChange={e => set('plain_summary', e.target.value)}
                      rows={2}
                      placeholder="Plain-language explanation shown to the user"
                      className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Action taken (user-facing)</label>
            <input value={form.action_taken}
                   onChange={e => set('action_taken', e.target.value)}
                   placeholder="e.g. Post removed, Account warned"
                   className="w-full rounded-lg px-3 py-2 text-sm"
                   style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Action ends (optional, leave blank for permanent)</label>
            <input type="datetime-local"
                   value={form.action_end}
                   onChange={e => set('action_end', e.target.value)}
                   className="w-full rounded-lg px-3 py-2 text-sm"
                   style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
          </div>

          {error && (
            <p className="text-xs" style={{ color: 'var(--accent-caution)' }}>
              {(error as Error).message}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => mutate()}
                    disabled={isPending || !form.reason.trim() || !form.plain_summary.trim()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                    style={{ background: 'var(--accent-caution)', color: '#fff' }}>
              {isPending ? 'Issuing…' : 'Issue action'}
            </button>
            <button onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Report row ───────────────────────────────────────────────────────────────

function ReportRow({ report, token }: { report: AdminReport; token: string }) {
  const qc = useQueryClient()
  const [escalating, setEscalating] = useState(false)

  const { mutate: patch, isPending } = useMutation({
    mutationFn: (action: 'dismiss' | 'reviewed') => adminApi.patchReport(report.id, action, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reports'] }),
  })

  const target = report.reported_user
    ? `@${report.reported_user.handle}`
    : report.content?.author.handle
    ? `post by @${report.content.author.handle}`
    : 'unknown'

  return (
    <>
      {escalating && (
        <EscalateForm report={report} token={token} onClose={() => setEscalating(false)} />
      )}

      <div className="rounded-xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full mr-2"
                  style={{ background: 'color-mix(in srgb, var(--accent-caution) 15%, transparent)', color: 'var(--accent-caution)' }}>
              {report.reason}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {relativeTime(report.created_at)} · @{report.reporter.handle} → {target}
            </span>
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            #{report.id.slice(0, 8)}
          </span>
        </div>

        {/* Content excerpt */}
        {report.content?.body && (
          <p className="text-sm mb-2 px-3 py-2 rounded-lg italic"
             style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
            {report.content.body}
          </p>
        )}

        {/* Detail */}
        {report.detail && (
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            &ldquo;{report.detail}&rdquo;
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => setEscalating(true)}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--accent-caution)', color: '#fff' }}>
            Escalate
          </button>
          <button onClick={() => patch('reviewed')}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            Mark reviewed
          </button>
          <button onClick={() => patch('dismiss')}
                  disabled={isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            Dismiss
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewed'>('pending')

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn:  () => usersApi.me(accessToken!),
    enabled:  !!accessToken,
  })

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn:  () => adminApi.reports(accessToken!, statusFilter),
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
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit"
           style={{ background: 'var(--bg-elevated)' }}>
        {(['pending', 'reviewed'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
                  style={{
                    background: statusFilter === s ? 'var(--bg-surface)' : 'transparent',
                    color:      statusFilter === s ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}>
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No {statusFilter} reports.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map(r => (
            <ReportRow key={r.id} report={r} token={accessToken!} />
          ))}
        </div>
      )}
    </div>
  )
}
