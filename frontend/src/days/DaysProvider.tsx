import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { del, failure, get, patch, post } from '../lib/api'
import { toDateInput } from '../lib/date'
import { useSession, type Result } from '../session/context'
import { DaysContext, type DayTask } from './context'

/**
 * The day tracker's tasks, loaded from and saved through `/api/day-tasks`.
 * One request covers every view: the habit grid needs this month, the week
 * view needs the seven days around today, and that week can start in the
 * month before — so the range is the union of the two.
 *
 * <p>App keys the account scope on the user, so signing into another account
 * starts empty and loads its own.
 */
export function DaysProvider({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const userId = user?.id

  // Fixed at mount: a session left open past midnight keeps showing the day
  // its tasks belong to, rather than silently sliding onto the next one.
  const today = useMemo(() => toDateInput(new Date()), [])

  const range = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    // Sunday-first, matching the week view.
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
    return {
      from: toDateInput(monthStart < weekStart ? monthStart : weekStart),
      to: toDateInput(monthEnd > weekEnd ? monthEnd : weekEnd),
    }
  }, [])

  const [tasks, setTasks] = useState<DayTask[]>([])
  // Signed out there is nothing to load, so loading starts false and stays there.
  const [loading, setLoading] = useState(userId !== undefined)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (userId === undefined) return
    // A response for a load that has since been replaced must not land.
    let current = true
    get<DayTask[]>(`/api/day-tasks?from=${range.from}&to=${range.to}`)
      .then((loaded) => {
        if (current) setTasks(loaded)
      })
      .catch((e: unknown) => {
        if (current) setError(e instanceof Error ? e.message : 'Could not load your days.')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [userId, range, attempt])

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
    () => ({
      tasks,
      today: tasks.filter((task) => task.day === today),
      range,
      loading,
      error,
      reload,
      add,
      toggle,
      remove,
    }),
    [tasks, today, range, loading, error, reload, add, toggle, remove],
  )

  return <DaysContext.Provider value={value}>{children}</DaysContext.Provider>
}
