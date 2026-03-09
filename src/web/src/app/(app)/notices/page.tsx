'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { moderationApi, type Notice } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'

const NOTICE_TYPE_LABELS: Record<Notice['notice_type'], string> = {
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
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function NoticeRow({ notice }: { notice: Notice }) {
  const isUnread = !notice.read_at
  return (
    <Link href={`/notices/${notice.id}`}
          className="flex items-start gap-3 px-4 py-4 rounded-xl transition-colors"
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${isUnread ? 'var(--accent-caution)' : 'var(--border)'}`,
          }}>
      <div className="flex-shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 256 256" fill="none">
          <path d="M236,200a8,8,0,0,1-7,4H27a8,8,0,0,1-7-12L121,36a8,8,0,0,1,14,0l101,156A8,8,0,0,1,236,200Z"
                fill={isUnread ? 'rgba(196,147,90,0.15)' : 'none'}
                stroke="var(--accent-caution)" strokeWidth="14" strokeLinejoin="round"/>
          <line x1="128" y1="104" x2="128" y2="144" stroke="var(--accent-caution)" strokeWidth="14" strokeLinecap="round"/>
          <circle cx="128" cy="176" r="10" fill="var(--accent-caution)"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {NOTICE_TYPE_LABELS[notice.notice_type]}
          </span>
          {isUnread && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'var(--accent-caution)', color: '#fff' }}>
              New
            </span>
          )}
        </div>
        <p className="text-xs truncate mb-1" style={{ color: 'var(--text-secondary)' }}>
          {notice.plain_summary}
        </p>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {formatDate(notice.created_at)}
        </span>
      </div>
      <svg width="16" height="16" viewBox="0 0 256 256" fill="none" className="flex-shrink-0 mt-1">
        <path d="M96,48l80,80-80,80" stroke="var(--text-muted)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  )
}

export default function NoticesPage() {
  const { accessToken } = useAuthStore()

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn:  () => moderationApi.getNotices(accessToken!),
    enabled:  !!accessToken,
  })

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        Notices
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Enforcement actions on your account or content. Each notice includes the specific policy and an appeal path.
      </p>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl animate-pulse"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', height: 80 }} />
          ))}
        </div>
      )}

      {!isLoading && notices.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No notices. All clear.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {notices.map((notice) => <NoticeRow key={notice.id} notice={notice} />)}
      </div>
    </div>
  )
}
