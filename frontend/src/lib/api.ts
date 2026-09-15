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

/** A failed request. `message` is the server's `{ error }` text when it sent one. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    // fetch only rejects when no response came back at all: server down, wrong URL or CORS.
    throw new ApiError(0, "Can't reach the server. Try again in a moment.")
  }

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, body?.error ?? `Request failed (${res.status}).`)
  return body as T
}

export const get = <T>(path: string) => request<T>(path)

export const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })
