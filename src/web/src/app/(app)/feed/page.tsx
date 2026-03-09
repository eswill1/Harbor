'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { feedApi, type FeedPost } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function PostCard({ post }: { post: FeedPost }) {
  return (
    <article className="rounded-xl p-4"
             style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
             style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)' }}>
          {post.author.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {post.author.display_name}
          </span>
          <span className="text-xs ml-1.5" style={{ color: 'var(--text-muted)' }}>
            @{post.author.handle}
          </span>
        </div>
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          {formatRelative(post.created_at)}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
        {post.body}
      </p>
    </article>
  )
}

export default function FeedPage() {
  const { accessToken } = useAuthStore()
  const [offset, setOffset] = useState(0)
  const LIMIT = 20

  const { data, isLoading, isError } = useQuery({
    queryKey: ['feed', offset],
    queryFn:  () => feedApi.get(accessToken!, LIMIT, offset),
    enabled:  !!accessToken,
  })

  const posts = data?.posts ?? []
  const total = data?.total ?? 0

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Following
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Chronological — people you follow, unranked
          </p>
        </div>
        {/* Constitutional baseline badge */}
        <span className="text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: 'rgba(74,127,165,0.1)', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)' }}>
          Baseline view
        </span>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', height: 96 }} />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm" style={{ color: 'var(--accent-caution)' }}>
          Could not load feed. Try again.
        </p>
      )}

      {!isLoading && !isError && posts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nothing here yet. Follow people to see their posts.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {posts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      {total > LIMIT && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            disabled={offset === 0}
            className="px-4 py-2 rounded-xl text-sm disabled:opacity-30"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            ← Newer
          </button>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + LIMIT)}
            disabled={offset + LIMIT >= total}
            className="px-4 py-2 rounded-xl text-sm disabled:opacity-30"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
            Older →
          </button>
        </div>
      )}
    </div>
  )
}
