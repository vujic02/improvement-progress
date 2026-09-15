/**
 * The one place the frontend talks to the Spring API. Providers call `get` and
 * `post`; nothing else uses fetch directly.
 */
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const TOKEN_KEY = 'kaizen.token'

let token: string | null = localStorage.getItem(TOKEN_KEY)

export function getToken(): string | null {
  return token
}

/** Keeps the JWT for later requests; `null` forgets it (sign out, expired). */
export function setToken(next: string | null) {
  token = next
  if (next) localStorage.setItem(TOKEN_KEY, next)
  else localStorage.removeItem(TOKEN_KEY)
}

/**
 * The routes SecurityConfig leaves open. They never carry the token, so a 401
 * from one of them means wrong credentials, not a rejected session.
 */
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/register']

let onUnauthorized: (() => void) | null = null

/**
 * What to do when the API rejects the token a request carried — the session
 * provider signs out here. `null` removes it.
 */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

/** A failed request. `message` is the server's `{ error }` text when it sent one. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const sent = PUBLIC_PATHS.includes(path) ? null : token

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(sent ? { Authorization: `Bearer ${sent}` } : {}),
      },
    })
  } catch {
    // fetch only rejects when no response came back at all: server down, wrong URL or CORS.
    throw new ApiError(0, "Can't reach the server. Try again in a moment.")
  }

  // Only if the rejected token is still the one held: a late 401 for a token a
  // fresh sign-in has already replaced must not end the new session.
  if (res.status === 401 && sent && sent === token) onUnauthorized?.()

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, body?.error ?? `Request failed (${res.status}).`)
  return body as T
}

export const get = <T>(path: string) => request<T>(path)

export const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })

export const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) })
