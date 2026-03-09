'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { postsApi, ApiError } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'

const MAX_CHARS = 500

export default function ComposePage() {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const [body, setBody]   = useState('')
  const [error, setError] = useState('')

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
