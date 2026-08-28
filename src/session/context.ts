import { createContext, useContext } from 'react'

export interface Session {
  userName: string
  /** Whether the welcome/auth flow has been completed this visit. */
  signedIn: boolean
  signIn: (userName?: string) => void
  signOut: () => void
}

export const DEFAULT_NAME = 'Nikola'

export const SessionContext = createContext<Session | null>(null)

export function useSession(): Session {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
