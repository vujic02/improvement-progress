import { createContext, useContext } from 'react'
import type { Goal, GoalKind } from '../data/savings'

export interface NewGoal {
  name: string
  kind: GoalKind
  createdAt: string
  targetAt: string
}

export type Result = { ok: true } | { ok: false; reason: string }

export interface SavingsStore {
  /** Newest first — the order the grid renders in. */
  goals: Goal[]
  /** Rejects blank/long/duplicate names and a target before the start date. */
  addGoal: (goal: NewGoal) => Result
  removeGoal: (id: string) => void
  /** Rejects blank, long and duplicate steps within the same goal. */
  addStep: (goalId: string, label: string) => Result
  toggleStep: (goalId: string, stepId: string) => void
  removeStep: (goalId: string, stepId: string) => void
}

export const SavingsContext = createContext<SavingsStore | null>(null)

export function useSavings(): SavingsStore {
  const ctx = useContext(SavingsContext)
  if (!ctx) throw new Error('useSavings must be used inside <SavingsProvider>')
  return ctx
}
