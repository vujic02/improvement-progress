import { createContext, useContext } from 'react'
import type { Reminder } from '../data/reminders'

export type Result = { ok: true } | { ok: false; reason: string }

export interface DeliveryChannels {
  push: boolean
  email: boolean
}

export interface ProfileStore {
  /** The address the account signs in with, read from the session. */
  email: string
  /** Whether this device keeps the token after the browser closes. */
  keepSignedIn: boolean
  setKeepSignedIn: (keep: boolean) => void
  /**
   * Checks the fields, saves them through the API, then puts what it stored on
   * the session. `password` is the current one, needed only when the email changes.
   */
  saveAccount: (next: { name: string; email: string; password: string }) => Promise<Result>
  /**
   * Checks the fields, then changes the password through the API. Other devices
   * are signed out; this one carries on with the fresh token the server returns.
   */
  changePassword: (next: {
    current: string
    password: string
    confirm: string
  }) => Promise<Result>

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
