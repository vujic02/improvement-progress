import { createContext, useContext } from 'react'

export type Result = { ok: true } | { ok: false; reason: string }

/** Mirrors the API's `UserResponse` record. */
export interface User {
  id: number
  name: string
  email: string
}

/** Mirrors the API's `AuthResponse` record. `expiresIn` is seconds. */
export interface AuthResponse {
  token: string
  expiresIn: number
  user: User
}

/**
 * `checking` while a token left by an earlier visit is being confirmed with the
 * API, `in` once the API has accepted a token, `out` otherwise.
 */
export type SessionStatus = 'checking' | 'in' | 'out'

export interface Session {
  status: SessionStatus
  /** The signed-in account. Null while checking or signed out. */
  user: User | null
  /** The account's name, or the default greeting name when there is no account. */
  userName: string
  /**
   * Why the last session ended when the user did not end it — expired, or
   * retired from another device — for the sign-in screen. Null otherwise.
   */
  notice: string | null
  /**
   * Checks the credentials against the API and keeps the token on success.
   * `remember` keeps it after the browser closes.
   */
  signIn: (email: string, password: string, remember: boolean) => Promise<Result>
  /** Creates the account and signs straight in with the token it returns. */
  register: (name: string, email: string, password: string, remember: boolean) => Promise<Result>
  signOut: () => void
  /** Retires every token for the account on the server, then signs out here. */
  signOutEverywhere: () => Promise<Result>
  /** Patches the signed-in account in place — the profile page writes through this. */
  updateUser: (patch: Partial<Pick<User, 'name' | 'email'>>) => void
}

export const DEFAULT_NAME = 'Nikola'

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
