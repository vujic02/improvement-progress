import { createContext, useContext } from 'react'
import type { Routine, RoutineForm } from '../data/routines'
import type { Result } from '../session/context'

export interface RoutineStore {
  /** Oldest first — the order they were set up in. */
  routines: Routine[]
  /** True while the list is being fetched. */
  loading: boolean
  /** Why the fetch failed, or null. */
  error: string | null
  /** Clears the error and fetches again. */
  reload: () => void
  /** Starts today; today's copy shows up in the day list straight away if the schedule includes today. */
  add: (form: RoutineForm) => Promise<Result>
  /** Past days keep what they had; today's copy follows if it is untouched. */
  update: (id: string, form: RoutineForm) => Promise<Result>
  /** Today's untouched copy goes with it; every other copy stays as a plain task. */
  remove: (id: string) => Promise<Result>
}

export const RoutinesContext = createContext<RoutineStore | null>(null)

export function useRoutines(): RoutineStore {
  const ctx = useContext(RoutinesContext)
  if (!ctx) throw new Error('useRoutines must be used inside <RoutinesProvider>')
  return ctx
}
