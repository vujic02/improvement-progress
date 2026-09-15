import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { get, getToken, post, setToken, setUnauthorizedHandler } from '../lib/api'
import {
  DEFAULT_NAME,
  SessionContext,
  type AuthResponse,
  type Result,
  type SessionStatus,
  type User,
} from './context'

/** Shown on sign-in when a session ends without the user ending it. */
const SESSION_ENDED = 'Your session ended. Sign in again.'

function failure(error: unknown): Result {
  return { ok: false, reason: error instanceof Error ? error.message : 'Something went wrong.' }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // With no stored token there is nothing to confirm, so skip straight to signed out.
  const [status, setStatus] = useState<SessionStatus>(() => (getToken() ? 'checking' : 'out'))
  const [notice, setNotice] = useState<string | null>(null)

  const start = useCallback((res: AuthResponse, remember: boolean) => {
    setToken(res.token, remember)
    setUser(res.user)
    setStatus('in')
    setNotice(null)
  }, [])

  // A token left by an earlier visit: ask the API whose it is. A 401 (expired,
  // retired, or the server's secret changed) has already signed out through
  // the unauthorized handler. Any other failure (server down) signs out for
  // now but keeps the token for the next load.
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
    async (email: string, password: string, remember: boolean): Promise<Result> => {
      try {
        start(await post<AuthResponse>('/api/auth/login', { email, password }), remember)
        return { ok: true }
      } catch (error) {
        return failure(error)
      }
    },
    [start],
  )

  const register = useCallback(
    async (name: string, email: string, password: string, remember: boolean): Promise<Result> => {
      try {
        start(await post<AuthResponse>('/api/auth/register', { name, email, password }), remember)
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
    setNotice(null)
  }, [])

  const signOutEverywhere = useCallback(async (): Promise<Result> => {
    try {
      await post<void>('/api/account/sign-out-everywhere')
      signOut()
      return { ok: true }
    } catch (error) {
      return failure(error)
    }
  }, [signOut])

  // Any request whose token the API rejects — expired, retired by a password
  // change or "sign out everywhere" on another device, account gone — ends the
  // session and says so on sign-in; the route guard in App takes the user there.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut()
      setNotice(SESSION_ENDED)
    })
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
      notice,
      signIn,
      register,
      signOut,
      signOutEverywhere,
      updateUser,
    }),
    [status, user, notice, signIn, register, signOut, signOutEverywhere, updateUser],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
