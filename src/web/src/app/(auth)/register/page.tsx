'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi, ApiError } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle]           = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register({ handle, display_name: displayName, email, password })
      setAuth(res.user, res.access_token, res.refresh_token)
      router.replace('/home')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-xl p-6 flex flex-col gap-4"
           style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {[
          { label: 'Display name', value: displayName, set: setDisplayName, type: 'text', auto: 'name' },
          { label: 'Handle', value: handle, set: setHandle, type: 'text', auto: 'username' },
          { label: 'Email', value: email, set: setEmail, type: 'email', auto: 'email' },
          { label: 'Password', value: password, set: setPassword, type: 'password', auto: 'new-password' },
        ].map(({ label, value, set, type, auto }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {label}
            </label>
            <input
              type={type}
              autoComplete={auto}
              value={value}
              onChange={(e) => set(e.target.value)}
              required
              className="rounded-md px-3 py-2 text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        ))}
        {error && (
          <p className="text-sm" style={{ color: 'var(--accent-caution)' }}>{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl px-4 py-3 text-sm font-semibold transition-opacity disabled:opacity-50"
        style={{ background: 'var(--accent-primary)', color: '#fff' }}
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--accent-primary)' }}>
          Sign in
        </Link>
      </p>
    </form>
  )
}
