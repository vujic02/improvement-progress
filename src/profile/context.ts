import { createContext, useContext } from 'react'
import type { Reminder } from '../data/reminders'

export type Result = { ok: true } | { ok: false; reason: string }

export interface DeliveryChannels {
  push: boolean
  email: boolean
}

export interface ProfileStore {
  /** The address the account signs in with. */
  email: string
  /** "Keep me signed in", as set on the auth screens. */
  keepSignedIn: boolean
  setKeepSignedIn: (keep: boolean) => void
  /** Writes the name through to the session and the email to this store. */
  saveAccount: (next: { name: string; email: string }) => Result
  /** No backend yet — this only validates and reports back. */
  changePassword: (next: {
    current: string
    password: string
    confirm: string
  }) => Result

  reminders: Reminder[]
  /** Patch one reminder — toggle it, or change when it fires. */
  updateReminder: (id: string, patch: Partial<Reminder>) => void
  /** Master switch. Nothing goes out while this is on. */
  paused: boolean
  setPaused: (paused: boolean) => void
  channels: DeliveryChannels
  setChannel: (channel: keyof DeliveryChannels, on: boolean) => void
}

export const ProfileContext = createContext<ProfileStore | null>(null)

export function useProfile(): ProfileStore {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>')
  return ctx
}
