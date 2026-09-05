import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_REMINDERS, type Reminder } from '../data/reminders'
import { useSession } from '../session/context'
import { ProfileContext, type DeliveryChannels, type Result } from './context'

/** Placeholder address until the auth screens post to something real. */
export const DEFAULT_EMAIL = 'nikola@kaizen.app'

/** Shortest password the register form will accept. */
export const PASSWORD_MIN = 8

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Account details and notification settings for the session. Like the other
 * providers, nothing is persisted and nothing is sent anywhere — the password
 * form validates and reports back, it does not store what you typed.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { setUserName } = useSession()

  const [email, setEmail] = useState(DEFAULT_EMAIL)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS)
  const [paused, setPaused] = useState(false)
  const [channels, setChannels] = useState<DeliveryChannels>({ push: true, email: true })

  const saveAccount = useCallback(
    ({ name, email: nextEmail }: { name: string; email: string }): Result => {
      const trimmedName = name.trim()
      const trimmedEmail = nextEmail.trim()
      if (!trimmedName) return { ok: false, reason: 'Your name cannot be empty.' }
      if (!EMAIL_RE.test(trimmedEmail)) return { ok: false, reason: "That email doesn't look right." }

      setUserName(trimmedName)
      setEmail(trimmedEmail)
      return { ok: true }
    },
    [setUserName],
  )

  const changePassword = useCallback(
    ({ current, password, confirm }: { current: string; password: string; confirm: string }): Result => {
      if (!current) return { ok: false, reason: 'Enter your current password.' }
      if (password.length < PASSWORD_MIN) {
        return { ok: false, reason: `Use at least ${PASSWORD_MIN} characters.` }
      }
      if (password === current) return { ok: false, reason: 'That is your current password.' }
      if (password !== confirm) return { ok: false, reason: "The two new passwords don't match." }
      return { ok: true }
    },
    [],
  )

  const updateReminder = useCallback((id: string, patch: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
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
