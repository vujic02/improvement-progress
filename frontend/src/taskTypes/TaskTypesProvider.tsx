import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { IconName } from '../components/Icon'
import {
  CUSTOM_TASK_TYPE_LIMIT,
  DEFAULT_TASK_TYPES,
  TASK_TYPE_NAME_MAX,
  type TaskType,
} from '../data/taskTypes'
import { del, failure, get, post } from '../lib/api'
import { useSession, type Result } from '../session/context'
import { TaskTypesContext } from './context'

/**
 * The signed-in account's custom task types, loaded from and saved through
 * `/api/task-types`. App keys this provider on the account, so signing into
 * another one starts empty and loads its own. The checks in `addCustom` give
 * an instant message; `TaskTypeService` repeats them, because it cannot trust
 * a client to have run them.
 */
export function TaskTypesProvider({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const userId = user?.id

  const [custom, setCustom] = useState<TaskType[]>([])
  // Signed out there is nothing to load, so loading starts false and stays there.
  const [loading, setLoading] = useState(userId !== undefined)
  const [error, setError] = useState<string | null>(null)
  // Bumped by `reload` to run the load again.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (userId === undefined) return
    // A response for a load that has since been replaced must not land.
    let current = true
    get<TaskType[]>('/api/task-types')
      .then((types) => {
        if (current) setCustom(types)
      })
      .catch((e: unknown) => {
        if (current) setError(e instanceof Error ? e.message : 'Could not load your task types.')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [userId, attempt])

  const reload = useCallback(() => {
    setError(null)
    setLoading(true)
    setAttempt((n) => n + 1)
  }, [])

  const addCustom = useCallback(
    async (label: string, icon: IconName): Promise<Result> => {
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

      try {
        // The server assigns the id and the colour, so keep what it stored.
        const created = await post<TaskType>('/api/task-types', { label: name, icon })
        setCustom((prev) => [...prev, created])
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [custom],
  )

  const removeCustom = useCallback(async (id: string): Promise<Result> => {
    try {
      await del(`/api/task-types/${id}`)
      // Only once the server has let it go, so a failed delete leaves the card in place.
      setCustom((prev) => prev.filter((t) => t.id !== id))
      return { ok: true }
    } catch (e) {
      return failure(e)
    }
  }, [])

  const value = useMemo(
    () => ({
      defaults: DEFAULT_TASK_TYPES,
      custom,
      all: [...DEFAULT_TASK_TYPES, ...custom],
      remaining: CUSTOM_TASK_TYPE_LIMIT - custom.length,
      loading,
      error,
      reload,
      addCustom,
      removeCustom,
    }),
    [custom, loading, error, reload, addCustom, removeCustom],
  )

  return <TaskTypesContext.Provider value={value}>{children}</TaskTypesContext.Provider>
}
