import { createContext, useContext } from 'react'
import type { IconName } from '../components/Icon'
import type { TaskType } from '../data/taskTypes'

export interface TaskTypesStore {
  /** The ten built-ins. Never empty, never editable. */
  defaults: TaskType[]
  /** User-added types, oldest first. */
  custom: TaskType[]
  /** defaults + custom, in that order — what the tracker scores against. */
  all: TaskType[]
  /** How many custom slots are left. */
  remaining: number
  /** Rejects blank names, duplicates and a full list; returns why it failed. */
  addCustom: (label: string, icon: IconName) => { ok: true } | { ok: false; reason: string }
  removeCustom: (id: string) => void
}

export const TaskTypesContext = createContext<TaskTypesStore | null>(null)

export function useTaskTypes(): TaskTypesStore {
  const ctx = useContext(TaskTypesContext)
  if (!ctx) throw new Error('useTaskTypes must be used inside <TaskTypesProvider>')
  return ctx
}
