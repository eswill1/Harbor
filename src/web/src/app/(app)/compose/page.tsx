'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { postsApi, ApiError, type LinkPreview } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'

const MAX_CHARS = 500
const URL_RE    = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i

export default function ComposePage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [body, setBody]   = useState('')
  const [error, setError] = useState('')
  const [linkPreview, setLinkPreview]       = useState<LinkPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const match = body.match(URL_RE)
    if (!match) { setLinkPreview(null); return }
    const url = match[0].replace(/[.,;!?)]+$/, '')
    debounceRef.current = setTimeout(async () => {
      if (!accessToken) return
      setPreviewLoading(true)
      try {
        const result = await postsApi.getLinkPreview(url, accessToken)
        setLinkPreview(result.ok ? result : null)
      } catch {
        setLinkPreview(null)
      } finally {
        setPreviewLoading(false)
      }
    }, 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [body, accessToken])

  const { mutate: createPost, isPending } = useMutation({
    mutationFn: () => postsApi.create(body, accessToken!),
    onSuccess:  () => router.push('/home'),
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not post. Try again.')
    },
  })

  const remaining = MAX_CHARS - body.length
  const overLimit = remaining < 0

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} style={{ color: 'var(--text-secondary)' }}>
          <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
            <path d="M224,128H32M80,80 L32,128 80,176" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--text-primary)' }}>
          Write
        </h1>
      </div>

      <div className="rounded-xl p-4 mb-4"
           style={{ background: 'var(--bg-surface)', border: `1px solid ${overLimit ? 'var(--accent-caution)' : 'var(--border)'}` }}>
        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's on your mind?"
          rows={6}
          className="w-full resize-none outline-none text-sm leading-relaxed"
          style={{ background: 'transparent', color: 'var(--text-primary)' }}
        />
        {/* Live link preview */}
        {previewLoading && (
          <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>Fetching preview…</div>
        )}
        {linkPreview && !previewLoading && (
          <a href={linkPreview.canonical_url ?? linkPreview.url} target="_blank" rel="noopener noreferrer"
             className="block no-underline mt-3"
             style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            {linkPreview.is_youtube && linkPreview.youtube_id ? (
              <>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={linkPreview.image_url ?? `https://img.youtube.com/vi/${linkPreview.youtube_id}/hqdefault.jpg`}
                       alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(255,0,0,0.85)', borderRadius: 16,
                                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 256 256" fill="#fff"><polygon points="240,128 80,32 80,224"/></svg>
                  </div>
                </div>
                <div style={{ padding: '8px 12px 10px' }}>
                  <span style={{ background: '#FF0000', color: '#fff', fontSize: 10, fontWeight: 700,
                                 borderRadius: 3, padding: '1px 5px', letterSpacing: 0.3 }}>YouTube</span>
                  {linkPreview.title && <p className="text-xs font-semibold mt-1 line-clamp-2"
                     style={{ color: 'var(--text-primary)' }}>{linkPreview.title}</p>}
                </div>
              </>
            ) : (
              <>
                {linkPreview.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={linkPreview.image_url} alt=""
                       style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                )}
                <div style={{ padding: '8px 12px 10px' }}>
                  {linkPreview.site_name && (
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase',
                                letterSpacing: 0.4, marginBottom: 2 }}>{linkPreview.site_name}</p>
                  )}
                  {linkPreview.title && <p className="text-xs font-semibold line-clamp-2"
                     style={{ color: 'var(--text-primary)' }}>{linkPreview.title}</p>}
                </div>
              </>
            )}
          </a>
        )}
        <div className="flex items-center justify-between mt-3 pt-3"
             style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: overLimit ? 'var(--accent-caution)' : 'var(--text-muted)' }}>
            {remaining} remaining
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm mb-4" style={{ color: 'var(--accent-caution)' }}>{error}</p>
      )}

      <button
        onClick={() => { setError(''); createPost() }}
        disabled={!body.trim() || overLimit || isPending}
        className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-40"
        style={{ background: 'var(--accent-primary)', color: '#fff' }}>
        {isPending ? 'Posting…' : 'Post'}
      </button>
    </div>
  )
}
