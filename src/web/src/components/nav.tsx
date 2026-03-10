'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '../store/auth'
import { authApi } from '../lib/api'
import { useNotificationStore } from '../store/notifications'

const NAV_ITEMS = [
  { href: '/home',    label: 'Home',    icon: IconHome },
  { href: '/feed',    label: 'Following', icon: IconFeed },
  { href: '/shelves', label: 'Shelves', icon: IconShelves },
  { href: '/compose', label: 'Write',   icon: IconWrite },
  { href: '/profile', label: 'Profile', icon: IconProfile },
]

// ─── Inline SVG icons (Phosphor-style) ────────────────────────────────────────

function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
      <path
        d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77Z"
        fill={active ? 'var(--accent-primary)' : 'none'}
        stroke={active ? 'var(--accent-primary)' : 'var(--text-secondary)'}
        strokeWidth="16"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconFeed({ active }: { active: boolean }) {
  const c = active ? 'var(--accent-primary)' : 'var(--text-secondary)'
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
      <line x1="40" y1="64" x2="216" y2="64" stroke={c} strokeWidth="16" strokeLinecap="round"/>
      <line x1="40" y1="128" x2="216" y2="128" stroke={c} strokeWidth="16" strokeLinecap="round"/>
      <line x1="40" y1="192" x2="144" y2="192" stroke={c} strokeWidth="16" strokeLinecap="round"/>
    </svg>
  )
}

function IconShelves({ active }: { active: boolean }) {
  const c = active ? 'var(--accent-primary)' : 'var(--text-secondary)'
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
      <rect x="16" y="96" width="224" height="32" rx="8"
            fill={active ? 'var(--accent-primary)' : 'none'}
            stroke={c} strokeWidth="14"/>
      <rect x="16" y="168" width="224" height="32" rx="8"
            fill="none" stroke={c} strokeWidth="14"/>
      <line x1="72" y1="96" x2="72" y2="56" stroke={c} strokeWidth="14" strokeLinecap="round"/>
      <line x1="184" y1="96" x2="184" y2="56" stroke={c} strokeWidth="14" strokeLinecap="round"/>
      <line x1="72" y1="200" x2="72" y2="240" stroke={c} strokeWidth="14" strokeLinecap="round"/>
      <line x1="184" y1="200" x2="184" y2="240" stroke={c} strokeWidth="14" strokeLinecap="round"/>
    </svg>
  )
}

function IconWrite({ active }: { active: boolean }) {
  const c = active ? 'var(--accent-primary)' : 'var(--text-secondary)'
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
      <path d="M92,216H48a8,8,0,0,1-8-8V164a8,8,0,0,1,2.34-5.66l120-120a8,8,0,0,1,11.32,0l44,44a8,8,0,0,1,0,11.32Z"
            fill={active ? 'var(--accent-primary)' : 'none'}
            stroke={c} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="136" y1="64" x2="192" y2="120" stroke={active ? '#fff' : c} strokeWidth="14" strokeLinecap="round"/>
    </svg>
  )
}

function IconProfile({ active }: { active: boolean }) {
  const c = active ? 'var(--accent-primary)' : 'var(--text-secondary)'
  return (
    <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
      <circle cx="128" cy="96" r="48"
              fill={active ? 'var(--accent-primary)' : 'none'}
              stroke={c} strokeWidth="14"/>
      <path d="M16,216c0-53,50.15-96,112-96s112,43,112,96"
            stroke={c} strokeWidth="14" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Nav component ─────────────────────────────────────────────────────────────

export function SideNav() {
  const pathname     = usePathname()
  const router       = useRouter()
  const { clearAuth, accessToken, refreshToken } = useAuthStore()
  const unreadCount  = useNotificationStore((s) => s.unreadCount)

  async function handleLogout() {
    if (accessToken && refreshToken) {
      await authApi.logout(accessToken, refreshToken).catch(() => {})
    }
    clearAuth()
    router.replace('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 px-4 py-6 gap-1 z-20"
             style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}>
        <div className="px-3 py-2 mb-4">
          <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Harbor</span>
        </div>

        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active       = pathname === href || pathname.startsWith(href + '/')
          const showDot      = label === 'Profile' && unreadCount > 0
          return (
            <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                  style={{
                    background: active ? 'var(--bg-elevated)' : 'transparent',
                    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}>
              <div className="relative">
                <Icon active={active} />
                {showDot && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                       style={{ background: 'var(--accent-primary)' }} />
                )}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </Link>
          )
        })}

        <div className="flex-1" />

        <button onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
                style={{ color: 'var(--text-muted)' }}>
          <svg width="20" height="20" viewBox="0 0 256 256" fill="none">
            <path d="M112,216H48a16,16,0,0,1-16-16V56A16,16,0,0,1,48,40h64"
                  stroke="var(--text-muted)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="168 96 216 128 168 160"
                      stroke="var(--text-muted)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="88" y1="128" x2="216" y2="128"
                  stroke="var(--text-muted)" strokeWidth="14" strokeLinecap="round"/>
          </svg>
          Sign out
        </button>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex z-20"
           style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active  = pathname === href || pathname.startsWith(href + '/')
          const showDot = label === 'Profile' && unreadCount > 0
          return (
            <Link key={href} href={href}
                  className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
                  style={{ color: active ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
              <div className="relative">
                <Icon active={active} />
                {showDot && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                       style={{ background: 'var(--accent-primary)' }} />
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
