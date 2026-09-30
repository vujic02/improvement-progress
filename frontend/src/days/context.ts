import { createContext, useContext } from 'react'
import type { Result } from '../session/context'

/** Mirrors the API's `DayTaskResponse`. `day` is yyyy-mm-dd, `typeId` a `TaskType.id`. */
export interface DayTask {
  id: string
  typeId: string
  label: string
  day: string
  done: boolean
  /** The recurring task it was filled in from. Absent for a task added by hand. */
  routineId?: string
}

/** Long enough for a real sentence, short enough to stay one line on a card. */
export const TASK_LABEL_MAX = 80

/** The span of days held in the store, as yyyy-mm-dd. */
export interface DayRange {
  from: string
  to: string
}

export interface DaysStore {
  /** Every task in `range`, oldest first — what the week and month views read. */
  tasks: DayTask[]
  /** Today's tasks, oldest first. */
  today: DayTask[]
  /**
   * Today as yyyy-mm-dd, fixed at mount. Sent with every read so the server
   * fills in recurring tasks up to the user's today, not its own.
   */
  todayKey: string
  /** The span loaded: this month, widened to cover the whole current week. */
  range: DayRange
  /** True while the day is being fetched. */
  loading: boolean
  /** Why the fetch failed, or null. */
  error: string | null
  /** Runs the fetch again — after a failure, a deleted task type, or a routine change. */
  reload: () => void
  /** Logs a task against today; returns why it failed. */
  add: (typeId: string, label: string) => Promise<Result>
  /** Flips done on the server and keeps what it stored. */
  toggle: (id: string) => Promise<Result>
  remove: (id: string) => Promise<Result>
}

export const DaysContext = createContext<DaysStore | null>(null)

export function useDays(): DaysStore {
  const ctx = useContext(DaysContext)
  if (!ctx) throw new Error('useDays must be used inside <DaysProvider>')
  return ctx
}
