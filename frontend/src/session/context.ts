import { createContext, useContext } from 'react'

export type Result = { ok: true } | { ok: false; reason: string }

export interface Session {
  userName: string
  /** Whether this browser holds a token the API accepted. */
  signedIn: boolean
  /** Checks the credentials against the API and keeps the token on success. */
  signIn: (email: string, password: string) => Promise<Result>
  /** Creates the account and signs straight in with the token it returns. */
  register: (name: string, email: string, password: string) => Promise<Result>
  signOut: () => void
  /** Renames the signed-in user — the profile page writes through this. */
  setUserName: (userName: string) => void
}

export const DEFAULT_NAME = 'Nikola'

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
