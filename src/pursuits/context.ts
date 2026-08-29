import { useContext, type Context } from 'react'
import type { Pursuit } from '../data/pursuits'

export type Result = { ok: true } | { ok: false; reason: string }

export interface NewPursuit {
  name: string
  kind: string
  createdAt: string
  targetAt: string
}

export interface PursuitStore {
  /** Newest first — the order the grid renders in. */
  pursuits: Pursuit[]
  /** Rejects blank/long/duplicate names and a target before the start date. */
  add: (pursuit: NewPursuit) => Result
  remove: (id: string) => void
  /** Rejects blank, long and duplicate steps within the same pursuit. */
  addStep: (pursuitId: string, label: string) => Result
  toggleStep: (pursuitId: string, stepId: string) => void
  removeStep: (pursuitId: string, stepId: string) => void
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
