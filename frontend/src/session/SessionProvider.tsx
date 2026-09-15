import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, get, getToken, post, setToken } from '../lib/api'
import { DEFAULT_NAME, SessionContext, type Result } from './context'

/** Mirrors the API's `UserResponse` record. */
interface User {
  id: number
  name: string
  email: string
}

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
  const [userName, setUserName] = useState(DEFAULT_NAME)
  const [signedIn, setSignedIn] = useState(false)

  const start = useCallback((res: AuthResponse) => {
    setToken(res.token)
    setUserName(res.user.name)
    setSignedIn(true)
  }, [])

  // A token left by an earlier visit: ask the API whose it is. A 401 means it
  // expired or the server's secret changed, so forget it.
  useEffect(() => {
    if (!getToken()) return
    get<User>('/api/auth/me')
      .then((user) => {
        setUserName(user.name)
        setSignedIn(true)
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) setToken(null)
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
    setSignedIn(false)
  }, [])

  const rename = useCallback((name: string) => {
    if (name.trim()) setUserName(name.trim())
  }, [])

  const value = useMemo(
    () => ({ userName, signedIn, signIn, register, signOut, setUserName: rename }),
    [userName, signedIn, signIn, register, signOut, rename],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
