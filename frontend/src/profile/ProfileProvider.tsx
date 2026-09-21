import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_REMINDERS, type Reminder } from '../data/reminders'
import { failure, getToken, isTokenRemembered, patch, post, setToken } from '../lib/api'
import { useSession, type AuthResponse, type User } from '../session/context'
import { ProfileContext, type DeliveryChannels, type Result } from './context'

/** Shortest password the API accepts (`User.PASSWORD_MIN`), checked here too for an instant message. */
export const PASSWORD_MIN = 8

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Account details and notification settings. The account half goes through the
 * API — details via `PATCH /api/account`, the password via
 * `POST /api/account/password`. Reminders and channels still live only in this
 * session. The local checks stay so a bad field gets an answer with no round
 * trip; the server runs the same checks because a browser can be bypassed.
 *
 * "Keep me signed in" belongs to this device rather than the account, so it
 * lives with the token instead of on the server.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useSession()
  const email = user?.email ?? ''

  const [keepSignedIn, setKeep] = useState(isTokenRemembered)
  const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS)
  const [paused, setPaused] = useState(false)
  const [channels, setChannels] = useState<DeliveryChannels>({ push: true, email: true })

  // Moves the token between localStorage and sessionStorage; nothing to move when signed out.
  const setKeepSignedIn = useCallback((keep: boolean) => {
    const current = getToken()
    if (current) setToken(current, keep)
    setKeep(keep)
  }, [])

  const saveAccount = useCallback(
    async ({
      name,
      email: nextEmail,
      password,
    }: {
      name: string
      email: string
      password: string
    }): Promise<Result> => {
      const trimmedName = name.trim()
      const trimmedEmail = nextEmail.trim()
      if (!trimmedName) return { ok: false, reason: 'Your name cannot be empty.' }
      if (!EMAIL_RE.test(trimmedEmail)) return { ok: false, reason: "That email doesn't look right." }

      // Stored emails are lowercase, so a change of case alone is not a new address.
      const emailChanged = trimmedEmail.toLowerCase() !== email
      if (emailChanged && !password) {
        return { ok: false, reason: 'Enter your current password to change your email.' }
      }

      try {
        // The session takes what the server stored, not what was typed — it lowercases emails.
        const saved = await patch<User>('/api/account', {
          name: trimmedName,
          email: trimmedEmail,
          ...(emailChanged ? { password } : {}),
        })
        updateUser({ name: saved.name, email: saved.email })
        return { ok: true }
      } catch (error) {
        return failure(error)
      }
    },
    [email, updateUser],
  )

  const changePassword = useCallback(
    async ({ current, password, confirm }: { current: string; password: string; confirm: string }): Promise<Result> => {
      if (!current) return { ok: false, reason: 'Enter your current password.' }
      if (password.length < PASSWORD_MIN) {
        return { ok: false, reason: `Use at least ${PASSWORD_MIN} characters.` }
      }
      if (password === current) return { ok: false, reason: 'That is your current password.' }
      if (password !== confirm) return { ok: false, reason: "The two new passwords don't match." }

      try {
        // A wrong current password comes back as a 400 with its own message, not a 401.
        const res = await post<AuthResponse>('/api/account/password', { current, password, confirm })
        // The server retired every older token, this session's included; carry on with the fresh one.
        setToken(res.token)
        return { ok: true }
      } catch (error) {
        return failure(error)
      }
    },
    [],
  )

  const updateReminder = useCallback((id: string, changes: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)))
  }, [])

  const setChannel = useCallback((channel: keyof DeliveryChannels, on: boolean) => {
    setChannels((prev) => ({ ...prev, [channel]: on }))
  }, [])

  const value = useMemo(
    () => ({
      email,
      keepSignedIn,
      setKeepSignedIn,
      saveAccount,
      changePassword,
      reminders,
      updateReminder,
      paused,
      setPaused,
      channels,
      setChannel,
    }),
    [
      email,
      keepSignedIn,
      setKeepSignedIn,
      saveAccount,
      changePassword,
      reminders,
      updateReminder,
      paused,
      channels,
      setChannel,
    ],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
