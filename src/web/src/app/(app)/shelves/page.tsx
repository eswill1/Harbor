'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shelvesApi, ApiError } from '../../../lib/api'
import { useAuthStore } from '../../../store/auth'

export default function ShelvesPage() {
  const { accessToken }  = useAuthStore()
  const qc               = useQueryClient()
  const [newName, setNewName]   = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError]       = useState('')

  const { data: shelves = [], isLoading } = useQuery({
    queryKey: ['shelves'],
    queryFn:  () => shelvesApi.list(accessToken!),
    enabled:  !!accessToken,
  })

  const { mutate: createShelf, isPending: isCreating } = useMutation({
    mutationFn: (name: string) => shelvesApi.create(name, accessToken!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shelves'] })
      setNewName('')
      setCreating(false)
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not create shelf.')
    },
  })

  const { mutate: deleteShelf } = useMutation({
    mutationFn: (id: string) => shelvesApi.remove(id, accessToken!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shelves'] }),
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setError('')
    createShelf(newName.trim())
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Shelves
        </h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full"
          style={{ background: 'var(--accent-primary)', color: '#fff' }}>
          <svg width="14" height="14" viewBox="0 0 256 256" fill="none">
            <line x1="128" y1="40" x2="128" y2="216" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
            <line x1="40" y1="128" x2="216" y2="128" stroke="currentColor" strokeWidth="20" strokeLinecap="round"/>
          </svg>
          New shelf
        </button>
      </div>

      {/* Create shelf form */}
      {creating && (
        <form onSubmit={handleCreate} className="mb-4 p-4 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Shelf name
          </label>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Photography"
              className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
            <button type="submit" disabled={isCreating || !newName.trim()}
                    className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    style={{ background: 'var(--accent-primary)', color: '#fff' }}>
              Create
            </button>
            <button type="button" onClick={() => setCreating(false)}
                    className="px-3 py-2 rounded-md text-sm"
                    style={{ color: 'var(--text-secondary)' }}>
              Cancel
            </button>
          </div>
          {error && <p className="text-xs mt-2" style={{ color: 'var(--accent-caution)' }}>{error}</p>}
        </form>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl animate-pulse"
                 style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', height: 64 }} />
          ))}
        </div>
      )}

      {!isLoading && shelves.length === 0 && !creating && (
        <div className="text-center py-16">
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            No shelves yet. Create one to start saving content.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {shelves.map((shelf) => (
          <div key={shelf.id} className="flex items-center gap-3 rounded-xl px-4 py-3"
               style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <Link href={`/shelves/${shelf.id}`} className="flex-1 min-w-0">
              <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {shelf.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {shelf.item_count} saved
              </div>
            </Link>
            <button
              onClick={() => {
                if (confirm(`Delete "${shelf.name}"?`)) deleteShelf(shelf.id)
              }}
              className="p-1.5 rounded-md transition-colors flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 256 256" fill="none">
                <polyline points="216 48 40 48" stroke="currentColor" strokeWidth="16" strokeLinecap="round"/>
                <path d="M104,104v64M152,104v64M40,48l16,168H200L216,48"
                      stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M96,48V32h64V48" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
