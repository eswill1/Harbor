'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { usersApi, authApi } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'
import { useThemeStore, type ThemeMode } from '../../../store/theme'
import { useNotificationStore } from '../../../store/notifications'

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light',  label: 'Light'  },
  { value: 'dark',   label: 'Dark'   },
]

export default function ProfilePage() {
  const router = useRouter()
  const { user, accessToken, clearAuth } = useAuthStore()
  const { mode, setMode }               = useThemeStore()
  const setUnreadCount                  = useNotificationStore((s) => s.setUnreadCount)

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn:  () => usersApi.me(accessToken!),
    enabled:  !!accessToken,
  })

  useEffect(() => {
    if (profile?.unread_notifications !== undefined) {
      setUnreadCount(profile.unread_notifications)
    }
  }, [profile?.unread_notifications])

  async function handleLogout() {
    if (accessToken) {
      const { refreshToken } = useAuthStore.getState()
      if (refreshToken) {
        await authApi.logout(accessToken, refreshToken).catch(() => {})
      }
    }
    clearAuth()
    router.replace('/login')
  }

  if (!user) return null

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        Profile
      </h1>

      {/* User card */}
      <div className="rounded-xl p-5 mb-4"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
               style={{ background: 'var(--bg-elevated)', color: 'var(--accent-primary)' }}>
            {user.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              {user.display_name}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              @{user.handle}
            </div>
          </div>
        </div>

        {profile && (
          <div className="mt-4 pt-4 grid grid-cols-3 gap-4 text-center"
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
        )}
      </div>

      {/* Appearance */}
      <div className="rounded-xl p-4 mb-4"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
          Appearance
        </div>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: mode === value ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color:      mode === value ? '#fff' : 'var(--text-secondary)',
                border:     `1px solid ${mode === value ? 'var(--accent-primary)' : 'var(--border)'}`,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="rounded-xl overflow-hidden mb-4"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {([
          { href: '/notifications', label: 'Notifications', icon: '🔔' },
          { href: '/notices',       label: 'Notices',       icon: '⚠' },
          { href: '/compose',       label: 'Write a post',  icon: '✏' },
        ] as const).map(({ href, label, icon }, i, arr) => (
          <Link key={href} href={href}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                style={{
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  color: 'var(--text-primary)',
                }}>
            <span className="text-base w-5 text-center">{icon}</span>
            <span className="text-sm font-medium flex-1">{label}</span>
            <svg width="16" height="16" viewBox="0 0 256 256" fill="none">
              <path d="M96,48l80,80-80,80" stroke="var(--text-muted)" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ))}
      </div>

      <button onClick={handleLogout}
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--accent-caution)',
                border: '1px solid var(--border)',
              }}>
        Sign out
      </button>
    </div>
  )
}
