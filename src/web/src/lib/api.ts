import { getAuthStore } from '../store/auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.dev.joinharbor.app'

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

// One in-flight refresh promise shared across concurrent requests so we don't
// fire multiple /auth/refresh calls when several requests 401 simultaneously.
let refreshPromise: Promise<string> | null = null

async function doRefresh(): Promise<string> {
  const { refreshToken, setTokens, clearAuth } = getAuthStore()
  if (!refreshToken) {
    clearAuth()
    throw new ApiError(401, 'No refresh token')
  }
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) {
    clearAuth()
    throw new ApiError(401, 'Session expired')
  }
  const { access_token, refresh_token } = await res.json()
  setTokens(access_token, refresh_token)
  return access_token
}

async function request<T>(
  method: Method,
  path: string,
  options: { body?: unknown; token?: string } = {},
): Promise<T> {
  const doFetch = (token?: string) => {
    const headers: Record<string, string> = {}
    if (options.body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  }

  let res = await doFetch(options.token)

  // On 401, attempt a single token refresh then retry.
  if (res.status === 401 && options.token) {
    try {
      if (!refreshPromise) refreshPromise = doRefresh().finally(() => { refreshPromise = null })
      const newToken = await refreshPromise
      res = await doFetch(newToken)
    } catch {
      throw new ApiError(401, 'Session expired — please sign in again')
    }
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data?.message ?? 'Request failed')
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

export interface LinkPreview {
  url:           string
  canonical_url: string | null
  title:         string | null
  description:   string | null
  image_url:     string | null
  site_name:     string | null
  is_youtube:    boolean
  youtube_id:    string | null
}

export interface DeckCard {
  id:             string
  position:       number
  creator:        { id: string; name: string; handle: string }
  content:        string
  source_bucket:  'friends' | 'groups' | 'shelves' | 'discovery'
  is_serendipity: boolean
  arousal_band:   'low' | 'medium' | 'high'
  link_preview:   LinkPreview | null
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
    api.post<{ ok: boolean; regret_prompted: boolean }>(`/api/sessions/${sessionId}/complete`, { satisfaction }, token),

  submitRegret: (sessionId: string, regret: 1 | 2 | 3, token: string) =>
    api.post<{ ok: boolean }>(`/api/sessions/${sessionId}/regret`, { regret }, token),
}

// ─── Share API ────────────────────────────────────────────────────────────────

export const shareApi = {
  log: (contentId: string, shareType: 'friend' | 'group' | 'copy_link', token: string) =>
    api.post<{ ok: boolean }>(`/api/posts/${contentId}/share`, { share_type: shareType }, token),
}

// ─── Posts API ────────────────────────────────────────────────────────────────

export interface Post {
  id:         string
  body:       string
  created_at: string
  author:     { id: string; handle: string; display_name: string }
}

export const postsApi = {
  create: (content: string, token: string) =>
    api.post<Post>('/api/posts', { content }, token),

  feed: (token: string) =>
    api.get<Post[]>('/api/posts/feed', token),

  getLinkPreview: (url: string, token: string) =>
    api.get<LinkPreview & { ok: true } | { ok: false }>(`/api/link-preview?url=${encodeURIComponent(url)}`, token),
}

// ─── Feed API ─────────────────────────────────────────────────────────────────

export interface FeedPost {
  id:         string
  body:       string
  created_at: string
  author:     { id: string; handle: string; display_name: string }
}

export interface FeedResponse {
  posts: FeedPost[]
  total: number
}

export const feedApi = {
  get: (token: string, limit = 20, offset = 0) =>
    api.get<FeedResponse>(`/api/feed?limit=${limit}&offset=${offset}`, token),
}

// ─── Shelves API ──────────────────────────────────────────────────────────────

export interface Shelf {
  id:         string
  name:       string
  created_at: string
  item_count: number
}

export interface ShelfItem {
  id:         string
  content_id: string
  saved_at:   string
  post: {
    id:         string
    body:       string
    created_at: string
    author:     { id: string; handle: string; display_name: string }
  }
}

export const shelvesApi = {
  list: (token: string) =>
    api.get<Shelf[]>('/api/shelves', token),

  create: (name: string, token: string) =>
    api.post<Shelf>('/api/shelves', { name }, token),

  remove: (shelfId: string, token: string) =>
    api.delete<{ ok: boolean }>(`/api/shelves/${shelfId}`, token),

  items: (shelfId: string, token: string) =>
    api.get<ShelfItem[]>(`/api/shelves/${shelfId}/items`, token),

  saveItem: (shelfId: string, contentId: string, token: string) =>
    api.post<{ ok: boolean }>(`/api/shelves/${shelfId}/items`, { content_id: contentId }, token),

  removeItem: (shelfId: string, contentId: string, token: string) =>
    api.delete<{ ok: boolean }>(`/api/shelves/${shelfId}/items/${contentId}`, token),
}

// ─── Users API ────────────────────────────────────────────────────────────────

export interface UserProfile {
  id:              string
  handle:          string
  display_name:    string
  follower_count:  number
  following_count: number
  post_count:      number
  is_following:    boolean
}

export const usersApi = {
  me: (token: string) =>
    api.get<UserProfile>('/api/users/me', token),

  profile: (userId: string, token: string) =>
    api.get<UserProfile>(`/api/users/${userId}`, token),

  follow: (userId: string, token: string) =>
    api.post<{ ok: boolean }>(`/api/users/${userId}/follow`, {}, token),

  unfollow: (userId: string, token: string) =>
    api.delete<{ ok: boolean }>(`/api/users/${userId}/follow`, token),
}

// ─── Moderation API ───────────────────────────────────────────────────────────

export type NoticeType =
  | 'content_labeled'
  | 'content_interstitial'
  | 'content_distribution_limited'
  | 'content_removed'
  | 'account_feature_limited'
  | 'account_suspended'
  | 'account_banned'
  | 'appeal_outcome'

export type Notice = {
  id:                    string
  action_id:             string
  notice_type:           NoticeType
  policy_section:        string
  primary_reason_code:   string
  plain_summary:         string
  affected_content_id:   string | null
  affected_excerpt:      string | null
  action_taken:          string
  action_start:          string
  action_end:            string | null
  can_repost:            boolean
  repost_instructions:   string | null
  appeal_deadline:       string | null
  appeal_id:             string | null
  read_at:               string | null
  created_at:            string
}

export type Appeal = {
  id:           string
  status:       'pending' | 'upheld' | 'overturned'
  submitted_at: string
  outcome_note: string | null
}

export const moderationApi = {
  getNotices: (token: string, offset = 0) =>
    api.get<{ notices: Notice[]; total: number }>(`/api/moderation/notices?offset=${offset}`, token)
      .then((r) => r.notices),

  getNotice: (id: string, token: string) =>
    api.get<Notice>(`/api/moderation/notices/${id}`, token),

  submitAppeal: (notice_id: string, statement: string | undefined, token: string) =>
    api.post<Appeal>('/api/moderation/appeals', { notice_id, statement }, token),

  getAppeal: (id: string, token: string) =>
    api.get<Appeal>(`/api/moderation/appeals/${id}`, token),

  submitReport: (
    body: { content_id?: string; reported_user_id?: string; reason: string; detail?: string },
    token: string,
  ) => api.post<{ ok: boolean }>('/api/moderation/reports', body, token),
}
