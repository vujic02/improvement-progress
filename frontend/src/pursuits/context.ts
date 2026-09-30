import { useContext, type Context } from 'react'
import type { IconName } from '../components/Icon'
import type { Pursuit } from '../data/pursuits'
import type { Result } from '../session/context'

export type { Result }

/** Which page a store serves. Sent to `/api/pursuits` as `?area=`. */
export type PursuitAreaId = 'savings' | 'growth' | 'dreams'

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

/**
 * What the edit modal sends: the whole form. A blank optional field clears it.
 * No balance — that only moves through `contribute`.
 */
export type PursuitEdit = Omit<NewPursuit, 'saved'>

/**
 * A worded step for growth and dreams, or payments for a money area —
 * `count` identical ones, so 500 × 12 lays out a year in one go.
 */
export type NewStep = { label: string } | { amount: number; count?: number }

export interface PursuitStore {
  /** Newest first — the order the grid renders in. */
  pursuits: Pursuit[]
  /** True while the area's pursuits are being fetched. */
  loading: boolean
  /** Why the fetch failed, or null. */
  error: string | null
  /** Clears the error and fetches again. */
  reload: () => void
  /**
   * Rejects blank/long/duplicate names, a target before the start date, and an
   * image address that is not https — here first, then again on the server.
   */
  add: (pursuit: NewPursuit) => Promise<Result>
  /** The same checks as `add`, except a goal may keep its own name. */
  update: (id: string, edit: PursuitEdit) => Promise<Result>
  remove: (id: string) => Promise<Result>
  /**
   * Rejects blank, long and duplicate worded steps within the same pursuit,
   * and payments that are not a positive amount.
   */
  addStep: (pursuitId: string, step: NewStep) => Promise<Result>
  /** Ticking a payment puts its amount into the balance; unticking takes it out. */
  toggleStep: (pursuitId: string, stepId: string) => Promise<Result>
  removeStep: (pursuitId: string, stepId: string) => Promise<Result>
  /**
   * Moves money in or out of a pursuit's balance. Positive adds, negative
   * corrects a mistake; the balance is clamped at zero either way.
   */
  contribute: (pursuitId: string, amount: number) => Promise<Result>
}

export type PursuitContext = Context<PursuitStore | null>

/**
 * Reads whichever pursuit context is passed in. Each area owns its own context
 * object so the lists never see each other; `<PursuitsProvider>` fills it.
 */
export function usePursuitStore(context: PursuitContext, hookName: string): PursuitStore {
  const ctx = useContext(context)
  if (!ctx) throw new Error(`${hookName} must be used inside <PursuitsProvider>`)
  return ctx
}
