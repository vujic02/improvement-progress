import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_REMINDERS, type Reminder } from '../data/reminders'
import { patch, post } from '../lib/api'
import { useSession, type User } from '../session/context'
import { ProfileContext, type DeliveryChannels, type Result } from './context'

/** Shortest password the API accepts (`User.PASSWORD_MIN`), checked here too for an instant message. */
export const PASSWORD_MIN = 8

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function failure(error: unknown): Result {
  return { ok: false, reason: error instanceof Error ? error.message : 'Something went wrong.' }
}

/**
 * Account details and notification settings. The account half goes through the
 * API — details via `PATCH /api/account`, the password via
 * `POST /api/account/password`. Reminders and channels still live only in this
 * session. The local checks stay so a bad field gets an answer with no round
 * trip; the server runs the same checks because a browser can be bypassed.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useSession()
  const email = user?.email ?? ''

  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS)
  const [paused, setPaused] = useState(false)
  const [channels, setChannels] = useState<DeliveryChannels>({ push: true, email: true })

  const saveAccount = useCallback(
    async ({ name, email: nextEmail }: { name: string; email: string }): Promise<Result> => {
      const trimmedName = name.trim()
      const trimmedEmail = nextEmail.trim()
      if (!trimmedName) return { ok: false, reason: 'Your name cannot be empty.' }
      if (!EMAIL_RE.test(trimmedEmail)) return { ok: false, reason: "That email doesn't look right." }

      try {
        // The session takes what the server stored, not what was typed — it lowercases emails.
        const saved = await patch<User>('/api/account', { name: trimmedName, email: trimmedEmail })
        updateUser({ name: saved.name, email: saved.email })
        return { ok: true }
      } catch (error) {
        return failure(error)
      }
    },
    [updateUser],
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
        await post<void>('/api/account/password', { current, password, confirm })
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
    [email, keepSignedIn, saveAccount, changePassword, reminders, updateReminder, paused, channels, setChannel],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
