'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shelvesApi } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/auth'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ShelfDetailPage() {
  const { id }          = useParams<{ id: string }>()
  const router          = useRouter()
  const { accessToken } = useAuthStore()
  const qc              = useQueryClient()

  const { data: shelves = [] } = useQuery({
    queryKey: ['shelves'],
    queryFn:  () => shelvesApi.list(accessToken!),
    enabled:  !!accessToken,
  })
  const shelf = shelves.find((s) => s.id === id)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['shelf-items', id],
    queryFn:  () => shelvesApi.items(id, accessToken!),
    enabled:  !!accessToken && !!id,
  })

  const { mutate: removeItem } = useMutation({
    mutationFn: (contentId: string) => shelvesApi.removeItem(id, contentId, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shelf-items', id] }),
  })

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/shelves')}
                style={{ color: 'var(--text-secondary)' }}>
          <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
            <path d="M224,128H32M80,80 L32,128 80,176" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--text-primary)' }}>
          {shelf?.name ?? 'Shelf'}
        </h1>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {items.length} saved
        </span>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl animate-pulse"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', height: 96 }} />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Nothing saved here yet. Save posts from a deck to this shelf.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl p-4"
               style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                     style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)' }}>
                  {item.post.author.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {item.post.author.display_name}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  · Saved {formatDate(item.saved_at)}
                </span>
              </div>
              <button onClick={() => removeItem(item.content_id)}
                      className="p-1 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                <svg width="14" height="14" viewBox="0 0 256 256" fill="none">
                  <line x1="200" y1="56" x2="56" y2="200" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                  <line x1="56" y1="56" x2="200" y2="200" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {item.post.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
