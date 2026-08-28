import { useCallback, useMemo, useState, type ReactNode } from 'react'
import type { IconName } from '../components/Icon'
import {
  CUSTOM_COLORS,
  CUSTOM_TASK_TYPE_LIMIT,
  DEFAULT_TASK_TYPES,
  TASK_TYPE_NAME_MAX,
  type TaskType,
} from '../data/taskTypes'
import { TaskTypesContext } from './context'

/**
 * Holds the user's task types for the session. Nothing is persisted yet — see
 * PROJECT.md for the rules this has to keep once a backend exists.
 */
export function TaskTypesProvider({ children }: { children: ReactNode }) {
  const [custom, setCustom] = useState<TaskType[]>([])

  const addCustom = useCallback(
    (label: string, icon: IconName): { ok: true } | { ok: false; reason: string } => {
      const name = label.trim()
      if (!name) return { ok: false, reason: 'Give the type a name.' }
      if (name.length > TASK_TYPE_NAME_MAX) {
        return { ok: false, reason: `Keep it to ${TASK_TYPE_NAME_MAX} characters.` }
      }

      const taken = [...DEFAULT_TASK_TYPES, ...custom].some(
        (t) => t.label.toLowerCase() === name.toLowerCase(),
      )
      if (taken) return { ok: false, reason: 'You already have a type with that name.' }
      if (custom.length >= CUSTOM_TASK_TYPE_LIMIT) {
        return { ok: false, reason: `You can add ${CUSTOM_TASK_TYPE_LIMIT} types. Remove one first.` }
      }

      setCustom((prev) => [
        ...prev,
        {
          id: `custom-${Date.now()}-${prev.length}`,
          label: name,
          icon,
          color: CUSTOM_COLORS[prev.length % CUSTOM_COLORS.length],
          custom: true,
        },
      ])
      return { ok: true }
    },
    [custom],
  )

  const removeCustom = useCallback((id: string) => {
    setCustom((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      defaults: DEFAULT_TASK_TYPES,
      custom,
      all: [...DEFAULT_TASK_TYPES, ...custom],
      remaining: CUSTOM_TASK_TYPE_LIMIT - custom.length,
      addCustom,
      removeCustom,
    }),
    [custom, addCustom, removeCustom],
  )

  return <TaskTypesContext.Provider value={value}>{children}</TaskTypesContext.Provider>
}
