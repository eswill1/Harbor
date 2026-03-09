'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { moderationApi, ApiError } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/auth'

const NOTICE_TYPE_LABELS: Record<string, string> = {
  content_labeled:              'Content labeled',
  content_interstitial:         'Content warning added',
  content_distribution_limited: 'Reach limited',
  content_removed:              'Content removed',
  account_feature_limited:      'Feature access limited',
  account_suspended:            'Account suspended',
  account_banned:               'Account banned',
  appeal_outcome:               'Appeal decided',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export default function NoticeDetailPage() {
  const { id }          = useParams<{ id: string }>()
  const router          = useRouter()
  const { accessToken } = useAuthStore()
  const [statement, setStatement] = useState('')
  const [appealError, setAppealError] = useState('')
  const [appealDone, setAppealDone]   = useState(false)

  const { data: notice, isLoading } = useQuery({
    queryKey: ['notice', id],
    queryFn:  () => moderationApi.getNotice(id, accessToken!),
    enabled:  !!accessToken && !!id,
  })

  const { data: appeal } = useQuery({
    queryKey: ['appeal', notice?.appeal_id],
    queryFn:  () => moderationApi.getAppeal(notice!.appeal_id!, accessToken!),
    enabled:  !!accessToken && !!notice?.appeal_id,
  })

  const { mutate: submitAppeal, isPending: submitting } = useMutation({
    mutationFn: () =>
      moderationApi.submitAppeal(id, statement.trim() || undefined, accessToken!),
    onSuccess: () => setAppealDone(true),
    onError: (err) => {
      setAppealError(err instanceof ApiError ? err.message : 'Could not submit appeal.')
    },
  })

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="animate-pulse rounded-xl h-48"
             style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
      </div>
    )
  }

  if (!notice) return null

  const canAppeal = !!notice.appeal_deadline && !notice.appeal_id && !appealDone
  const appealDeadlinePassed = notice.appeal_deadline
    ? new Date(notice.appeal_deadline) < new Date()
    : false

  const appealStatusLabel: Record<string, string> = {
    pending:    'Your appeal is under review.',
    upheld:     'Appeal upheld — the action stands.',
    overturned: 'Appeal overturned — the action was reversed.',
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/notices')} style={{ color: 'var(--text-secondary)' }}>
          <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
            <path d="M224,128H32M80,80 L32,128 80,176" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--text-primary)' }}>
          Notice
        </h1>
      </div>

      {/* Notice card */}
      <div className="rounded-xl p-5 mb-4"
           style={{ background: 'var(--bg-surface)', border: '2px solid var(--accent-caution)' }}>
        <div className="flex items-start gap-3 mb-4">
          <svg width="20" height="20" viewBox="0 0 256 256" fill="none" className="flex-shrink-0 mt-0.5">
            <path d="M236,200a8,8,0,0,1-7,4H27a8,8,0,0,1-7-12L121,36a8,8,0,0,1,14,0l101,156A8,8,0,0,1,236,200Z"
                  fill="rgba(196,147,90,0.15)" stroke="var(--accent-caution)" strokeWidth="14" strokeLinejoin="round"/>
            <line x1="128" y1="104" x2="128" y2="144" stroke="var(--accent-caution)" strokeWidth="14" strokeLinecap="round"/>
            <circle cx="128" cy="176" r="10" fill="var(--accent-caution)"/>
          </svg>
          <div>
            <div className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              {NOTICE_TYPE_LABELS[notice.notice_type] ?? notice.notice_type}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {formatDate(notice.created_at)}
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
          {notice.plain_summary}
        </p>

        <div className="flex flex-col gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div><span className="font-medium">Policy section:</span> {notice.policy_section}</div>
          <div><span className="font-medium">Reason:</span> {notice.primary_reason_code}</div>
          <div><span className="font-medium">Action taken:</span> {notice.action_taken}</div>
          {notice.action_end && (
            <div><span className="font-medium">Expires:</span> {formatDate(notice.action_end)}</div>
          )}
        </div>

        {notice.affected_excerpt && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Affected content
            </div>
            <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
              "{notice.affected_excerpt}"
            </p>
          </div>
        )}
      </div>

      {/* Appeal section */}
      {appeal && (
        <div className="rounded-xl p-4 mb-4"
             style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Appeal status
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {appealStatusLabel[appeal.status]}
          </p>
          {appeal.outcome_note && (
            <p className="text-sm mt-2 italic" style={{ color: 'var(--text-secondary)' }}>
              {appeal.outcome_note}
            </p>
          )}
        </div>
      )}

      {canAppeal && !appealDeadlinePassed && (
        <div className="rounded-xl p-4 mb-4"
             style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Appeal this decision
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            You have until {formatDate(notice.appeal_deadline!)} to appeal.
            Your account will not be penalized for appealing.
          </p>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Optional: explain why you think this decision was incorrect."
            rows={4}
            className="w-full resize-none outline-none text-sm leading-relaxed rounded-md px-3 py-2 mb-3"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
          {appealError && (
            <p className="text-xs mb-2" style={{ color: 'var(--accent-caution)' }}>{appealError}</p>
          )}
          <button
            onClick={() => submitAppeal()}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}>
            {submitting ? 'Submitting…' : 'Submit appeal'}
          </button>
        </div>
      )}

      {appealDone && (
        <div className="rounded-xl p-4 mb-4"
             style={{ background: 'rgba(114,184,160,0.1)', border: '1px solid var(--accent-success)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--accent-success)' }}>
            Appeal submitted. We'll review it and notify you here.
          </p>
        </div>
      )}

      {!canAppeal && !notice.appeal_id && !appealDone && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          {appealDeadlinePassed
            ? 'The appeal window for this notice has passed.'
            : 'This notice does not have an appeal path.'}
        </p>
      )}
    </div>
  )
}
