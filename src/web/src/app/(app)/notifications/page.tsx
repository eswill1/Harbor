'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { notificationsApi, type AppNotification } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { useNotificationStore } from '../../../store/notifications'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  if (days  < 7)  return `${days}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function notificationText(n: AppNotification): string {
  if (n.type === 'follow')     return `@${n.actor.handle} started following you`
  if (n.type === 'shelf_save') return `@${n.actor.handle} saved your post`
  return ''
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function NotificationRow({ item }: { item: AppNotification }) {
  const router   = useRouter()
  const isUnread = item.read_at === null

  return (
    <div
      className="flex items-start gap-3 px-4 py-4 cursor-pointer transition-colors rounded-xl"
      style={{
        background: isUnread ? 'color-mix(in srgb, var(--accent-primary) 6%, transparent)' : 'var(--bg-surface)',
        border:     `1px solid ${isUnread ? 'var(--accent-primary)' : 'var(--border)'}`,
      }}
      onClick={() => {
        if (item.type === 'follow' && item.actor.id) {
          router.push(`/users/${item.actor.id}`)
        }
      }}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
           style={{ background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' }}>
        {item.type === 'follow' ? (
          <svg width="18" height="18" viewBox="0 0 256 256" fill="none">
            <circle cx="104" cy="80" r="56" stroke="var(--accent-primary)" strokeWidth="16"/>
            <path d="M16,216c0-53,39.4-96,88-96s88,43,88,96" stroke="var(--accent-primary)" strokeWidth="16" strokeLinecap="round"/>
            <line x1="200" y1="136" x2="200" y2="200" stroke="var(--accent-primary)" strokeWidth="16" strokeLinecap="round"/>
            <line x1="168" y1="168" x2="232" y2="168" stroke="var(--accent-primary)" strokeWidth="16" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 256 256" fill="none">
            <path d="M192,24H64A16,16,0,0,0,48,40V224l80-48,80,48V40A16,16,0,0,0,192,24Z"
                  stroke="var(--accent-primary)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {notificationText(item)}
        </p>
        {item.content_body && (
          <p className="text-xs mt-0.5 truncate italic" style={{ color: 'var(--text-secondary)' }}>
            {item.content_body}
          </p>
        )}
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {relativeTime(item.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
             style={{ background: 'var(--accent-primary)' }} />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { accessToken } = useAuthStore()
  const markReadStore   = useNotificationStore((s) => s.markRead)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.list(accessToken!),
    enabled:  !!accessToken,
  })

  const { mutate: markRead } = useMutation({
    mutationFn: () => notificationsApi.markRead(accessToken!),
    onSuccess:  () => markReadStore(),
  })

  useEffect(() => {
    if (accessToken) markRead()
  }, [accessToken])

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Notifications
      </h1>

      {isLoading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            No notifications yet.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {"You'll see follows and shelf saves here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
