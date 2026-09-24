import { createContext, useContext } from 'react'
import type { Result } from '../session/context'

/** Mirrors the API's `DayTaskResponse`. `day` is yyyy-mm-dd, `typeId` a `TaskType.id`. */
export interface DayTask {
  id: string
  typeId: string
  label: string
  day: string
  done: boolean
}

export interface DaysStore {
  /** Today's tasks, oldest first. The week and month ranges come later. */
  today: DayTask[]
  /** True while the day is being fetched. */
  loading: boolean
  /** Why the fetch failed, or null. */
  error: string | null
  /** Runs the fetch again — after a failure, or after a task type is deleted. */
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
