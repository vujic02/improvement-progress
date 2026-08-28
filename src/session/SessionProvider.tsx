import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_NAME, SessionContext } from './context'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState(DEFAULT_NAME)
  const [signedIn, setSignedIn] = useState(false)

  const signIn = useCallback((name?: string) => {
    if (name?.trim()) setUserName(name.trim())
    setSignedIn(true)
  }, [])

  const signOut = useCallback(() => setSignedIn(false), [])

  const value = useMemo(
    () => ({ userName, signedIn, signIn, signOut }),
    [userName, signedIn, signIn, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
