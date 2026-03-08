import Constants from 'expo-constants'

const BASE_URL: string =
  Constants.expoConfig?.extra?.apiUrl ?? 'https://api.dev.joinharbor.app'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

async function request<T>(
  method: Method,
  path: string,
  options: { body?: unknown; token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? 'Request failed')
  }

  return data as T
}

export const api = {
  get:    <T>(path: string, token?: string) =>
            request<T>('GET', path, { token }),
  post:   <T>(path: string, body: unknown, token?: string) =>
            request<T>('POST', path, { body, token }),
  put:    <T>(path: string, body: unknown, token?: string) =>
            request<T>('PUT', path, { body, token }),
  delete: <T>(path: string, token?: string) =>
            request<T>('DELETE', path, { token }),
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token:  string
  refresh_token: string
  user: {
    id:           string
    handle:       string
    display_name: string
  }
}

export const authApi = {
  register: (body: {
    handle:       string
    display_name: string
    email:        string
    password:     string
  }) => api.post<AuthResponse>('/auth/register', body),

  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', body),

  refresh: (refreshToken: string) =>
    api.post<Pick<AuthResponse, 'access_token' | 'refresh_token'>>(
      '/auth/refresh',
      { refresh_token: refreshToken },
    ),

  logout: (accessToken: string, refreshToken: string) =>
    api.post<{ success: boolean }>(
      '/auth/logout',
      { refresh_token: refreshToken },
      accessToken,
    ),
}

// ─── Deck API ─────────────────────────────────────────────────────────────────

export interface DeckCard {
  id:             string
  position:       number
  creator:        { name: string; handle: string }
  content:        string
  source_bucket:  'friends' | 'groups' | 'shelves' | 'discovery'
  is_serendipity: boolean
  arousal_band:   'low' | 'medium' | 'high'
}

export interface DeckResponse {
  session_id: string
  intent:     string
  cards:      DeckCard[]
}

export const deckApi = {
  create: (intent: string, token: string) =>
    api.post<DeckResponse>('/api/decks', { intent }, token),

  complete: (sessionId: string, satisfaction: 1 | 2 | 3, token: string) =>
    api.post<{ ok: boolean }>(`/api/sessions/${sessionId}/complete`, { satisfaction }, token),
}
