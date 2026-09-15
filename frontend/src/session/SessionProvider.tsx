import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { get, getToken, post, setToken, setUnauthorizedHandler } from '../lib/api'
import { DEFAULT_NAME, SessionContext, type Result, type SessionStatus, type User } from './context'

/** Mirrors the API's `AuthResponse` record. `expiresIn` is seconds. */
interface AuthResponse {
  token: string
  expiresIn: number
  user: User
}

function failure(error: unknown): Result {
  return { ok: false, reason: error instanceof Error ? error.message : 'Something went wrong.' }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // With no stored token there is nothing to confirm, so skip straight to signed out.
  const [status, setStatus] = useState<SessionStatus>(() => (getToken() ? 'checking' : 'out'))

  const start = useCallback((res: AuthResponse) => {
    setToken(res.token)
    setUser(res.user)
    setStatus('in')
  }, [])

  // A token left by an earlier visit: ask the API whose it is. A 401 (expired,
  // or the server's secret changed) has already signed out through the
  // unauthorized handler. Any other failure (server down) signs out for now
  // but keeps the token for the next load.
  useEffect(() => {
    const token = getToken()
    if (!token) return
    get<User>('/api/auth/me')
      .then((me) => {
        // Signed out, or into another account, while this was in flight.
        if (getToken() !== token) return
        setUser(me)
        setStatus('in')
      })
      .catch(() => {
        if (getToken() === token) setStatus('out')
      })
  }, [])

  const signIn = useCallback(
    async (email: string, password: string): Promise<Result> => {
      try {
        start(await post<AuthResponse>('/api/auth/login', { email, password }))
        return { ok: true }
      } catch (error) {
        return failure(error)
      }
    },
    [start],
  )

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<Result> => {
      try {
        start(await post<AuthResponse>('/api/auth/register', { name, email, password }))
        return { ok: true }
      } catch (error) {
        return failure(error)
      }
    },
    [start],
  )

  const signOut = useCallback(() => {
    setToken(null)
    setUser(null)
    setStatus('out')
  }, [])

  // Any request whose token the API rejects (expired, account gone) ends the
  // session; the route guard in App then takes the user to sign-in.
  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  const updateUser = useCallback((patch: Partial<Pick<User, 'name' | 'email'>>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const value = useMemo(
    () => ({
      status,
      user,
      userName: user?.name ?? DEFAULT_NAME,
      signIn,
      register,
      signOut,
      updateUser,
    }),
    [status, user, signIn, register, signOut, updateUser],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
