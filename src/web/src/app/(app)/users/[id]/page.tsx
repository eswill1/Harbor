'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/auth'

export default function UserProfilePage() {
  const { id }          = useParams<{ id: string }>()
  const router          = useRouter()
  const { user: me, accessToken } = useAuthStore()
  const qc              = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn:  () => usersApi.profile(id, accessToken!),
    enabled:  !!accessToken && !!id,
  })

  const { mutate: follow, isPending: following } = useMutation({
    mutationFn: () => usersApi.follow(id, accessToken!),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['user', id] }),
  })

  const { mutate: unfollow, isPending: unfollowing } = useMutation({
    mutationFn: () => usersApi.unfollow(id, accessToken!),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['user', id] }),
  })

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="animate-pulse rounded-xl h-40"
             style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
      </div>
    )
  }

  if (!profile) return null

  const isMe = me?.id === id

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} style={{ color: 'var(--text-secondary)' }}>
          <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
            <path d="M224,128H32M80,80 L32,128 80,176" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--text-primary)' }}>
          {profile.display_name}
        </h1>
      </div>

      <div className="rounded-xl p-5 mb-4"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
               style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)' }}>
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              {profile.display_name}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              @{profile.handle}
            </div>
          </div>
          {!isMe && (
            <button
              onClick={() => profile.is_following ? unfollow() : follow()}
              disabled={following || unfollowing}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-50"
              style={profile.is_following
                ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }
                : { background: 'var(--accent-primary)', color: '#fff' }
              }>
              {profile.is_following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-center pt-4"
             style={{ borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Posts',     value: profile.post_count },
            { label: 'Following', value: profile.following_count },
            { label: 'Followers', value: profile.follower_count },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
