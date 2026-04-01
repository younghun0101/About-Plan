const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
const ACCESS_TOKEN_KEY = 'about_plan_access_token'

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string | null
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    const errorMessage =
      payload?.error ||
      payload?.message ||
      `요청에 실패했습니다. (HTTP ${response.status})`
    throw new Error(errorMessage)
  }

  if (payload && typeof payload === 'object' && 'success' in payload) {
    const envelope = payload as ApiEnvelope<T>
    if (!envelope.success) {
      throw new Error(envelope.error || '요청에 실패했습니다.')
    }
    return envelope.data as T
  }

  return payload as T
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {},
): Promise<T> {
  const auth = options.auth ?? true
  const token = getAccessToken()
  const headers = new Headers(init.headers ?? {})

  if (!headers.has('Content-Type') && init.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 401) {
    clearAccessToken()
  }

  return parseResponse<T>(response)
}

