import { useContext, type Context } from 'react'
import type { IconName } from '../components/Icon'
import type { Pursuit } from '../data/pursuits'

export type Result = { ok: true } | { ok: false; reason: string }

export interface NewPursuit {
  name: string
  /** Areas with kinds send one; dreams send an icon instead. */
  kind?: string
  icon?: IconName
  /** Raw, as typed. The store validates and normalises it. */
  image?: string
  /** Money areas only, in `CURRENCY`. Blank fields arrive as undefined. */
  target?: number
  saved?: number
  createdAt: string
  targetAt: string
}

export interface PursuitStore {
  /** Newest first — the order the grid renders in. */
  pursuits: Pursuit[]
  /**
   * Rejects blank/long/duplicate names, a target before the start date, and an
   * image address that is not https.
   */
  add: (pursuit: NewPursuit) => Result
  remove: (id: string) => void
  /** Rejects blank, long and duplicate steps within the same pursuit. */
  addStep: (pursuitId: string, label: string) => Result
  toggleStep: (pursuitId: string, stepId: string) => void
  removeStep: (pursuitId: string, stepId: string) => void
  /**
   * Moves money in or out of a pursuit's balance. Positive adds, negative
   * corrects a mistake; the balance is clamped at zero either way.
   */
  contribute: (pursuitId: string, amount: number) => Result
}

export type PursuitContext = Context<PursuitStore | null>

/**
 * Reads whichever pursuit context is passed in. Each area owns its own context
 * object so the two lists never see each other; `<PursuitsProvider>` fills it.
 */
export function usePursuitStore(context: PursuitContext, hookName: string): PursuitStore {
  const ctx = useContext(context)
  if (!ctx) throw new Error(`${hookName} must be used inside <PursuitsProvider>`)
  return ctx
}
