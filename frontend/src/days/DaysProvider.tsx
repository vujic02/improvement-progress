import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { del, failure, get, patch, post } from '../lib/api'
import { toDateInput } from '../lib/date'
import { useSession, type Result } from '../session/context'
import { DaysContext, type DayTask } from './context'

/**
 * The day tracker's tasks, loaded from and saved through `/api/day-tasks`.
 * Today only for now — the endpoint takes a date range, so the week and month
 * views widen it rather than fetching their own way.
 *
 * <p>App keys the account scope on the user, so signing into another account
 * starts empty and loads its own.
 */
export function DaysProvider({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const userId = user?.id

  // The day this list is for. Fixed at mount: a session left open past
  // midnight keeps showing the day its tasks belong to.
  const today = useMemo(() => toDateInput(new Date()), [])

  const [tasks, setTasks] = useState<DayTask[]>([])
  // Signed out there is nothing to load, so loading starts false and stays there.
  const [loading, setLoading] = useState(userId !== undefined)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (userId === undefined) return
    // A response for a load that has since been replaced must not land.
    let current = true
    get<DayTask[]>(`/api/day-tasks?from=${today}&to=${today}`)
      .then((loaded) => {
        if (current) setTasks(loaded)
      })
      .catch((e: unknown) => {
        if (current) setError(e instanceof Error ? e.message : 'Could not load today.')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [userId, today, attempt])

  const reload = useCallback(() => {
    setError(null)
    setLoading(true)
    setAttempt((n) => n + 1)
  }, [])

  const add = useCallback(
    async (typeId: string, label: string): Promise<Result> => {
      const text = label.trim()
      if (!text) return { ok: false, reason: 'Describe the task first.' }
      if (!typeId) return { ok: false, reason: 'Pick a task type.' }

      try {
        const created = await post<DayTask>('/api/day-tasks', { day: today, typeId, label: text })
        setTasks((prev) => [...prev, created])
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [today],
  )

  const toggle = useCallback(async (id: string): Promise<Result> => {
    try {
      // No body: the server flips whatever it has, so two devices cannot talk
      // each other back into the state they started from.
      const updated = await patch<DayTask>(`/api/day-tasks/${id}`)
      setTasks((prev) => prev.map((task) => (task.id === id ? updated : task)))
      return { ok: true }
    } catch (e) {
      return failure(e)
    }
  }, [])

  const remove = useCallback(async (id: string): Promise<Result> => {
    try {
      await del(`/api/day-tasks/${id}`)
      setTasks((prev) => prev.filter((task) => task.id !== id))
      return { ok: true }
    } catch (e) {
      return failure(e)
    }
  }, [])

  const value = useMemo(
    () => ({ today: tasks, loading, error, reload, add, toggle, remove }),
    [tasks, loading, error, reload, add, toggle, remove],
  )

  return <DaysContext.Provider value={value}>{children}</DaysContext.Provider>
}
