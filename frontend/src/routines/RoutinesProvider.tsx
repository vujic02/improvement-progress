import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { MAX_AMOUNT } from '../data/pursuits'
import { DAYS_INTERVAL_MAX, WEEKS_INTERVAL_MAX, usesInterval, usesWeekdays } from '../data/routines'
import type { Routine, RoutineForm } from '../data/routines'
import { TASK_LABEL_MAX } from '../days/context'
import { useDays } from '../days/context'
import { del, failure, get, patch, post } from '../lib/api'
import { useSession, type Result } from '../session/context'
import { RoutinesContext } from './context'

/**
 * The cheap checks, run before a request so a slip gets an instant answer.
 * The server repeats every one of them.
 */
function check(form: RoutineForm): Result {
  const label = form.label.trim()
  if (!label) return { ok: false, reason: 'Describe the task first.' }
  if (label.length > TASK_LABEL_MAX) {
    return { ok: false, reason: `Keep it to ${TASK_LABEL_MAX} characters.` }
  }
  if (!form.typeId) return { ok: false, reason: 'Pick a task type.' }
  if (usesWeekdays(form.cadence) && !form.weekdays?.length) {
    return { ok: false, reason: 'Pick at least one day of the week.' }
  }
  if (form.cadence === 'month-day') {
    const day = form.dayOfMonth
    if (!day || !Number.isInteger(day) || day < 1 || day > 31) {
      return { ok: false, reason: 'Pick a day of the month from 1 to 31.' }
    }
  }
  if (usesInterval(form.cadence)) {
    const max = form.cadence === 'every-n-days' ? DAYS_INTERVAL_MAX : WEEKS_INTERVAL_MAX
    const unit = form.cadence === 'every-n-days' ? 'days' : 'weeks'
    const n = form.interval
    if (!n || !Number.isInteger(n) || n < 2 || n > max) {
      return { ok: false, reason: `Repeat every 2 to ${max} ${unit}.` }
    }
  }
  if (form.pursuitId && form.amount !== undefined) {
    if (!Number.isFinite(form.amount) || form.amount <= 0) {
      return { ok: false, reason: 'Enter an amount above zero.' }
    }
    if (form.amount > MAX_AMOUNT) return { ok: false, reason: 'That amount is too large.' }
  }
  return { ok: true }
}

/** Only the fields the cadence reads, so a stale weekday list never rides along. */
function body(form: RoutineForm) {
  return {
    label: form.label.trim(),
    typeId: form.typeId,
    cadence: form.cadence,
    weekdays: usesWeekdays(form.cadence) ? form.weekdays : undefined,
    dayOfMonth: form.cadence === 'month-day' ? form.dayOfMonth : undefined,
    interval: usesInterval(form.cadence) ? form.interval : undefined,
    // Left out, the server unlinks it — the form is the whole routine.
    pursuitId: form.pursuitId || undefined,
    amount: form.pursuitId ? form.amount : undefined,
  }
}

/**
 * Recurring tasks, loaded from and saved through `/api/routines`.
 *
 * <p>Every write sends the client's today — an edit or a removal reaches into
 * today's copy, and the day turns over where the user is. After each write the
 * days reload, because the server has just added, rewritten or removed today's
 * copy.
 */
export function RoutinesProvider({ children }: { children: ReactNode }) {
  const { user } = useSession()
  const userId = user?.id
  const { todayKey, reload: reloadDays } = useDays()

  const [routines, setRoutines] = useState<Routine[]>([])
  // Signed out there is nothing to load, so loading starts false and stays there.
  const [loading, setLoading] = useState(userId !== undefined)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (userId === undefined) return
    // A response for a load that has since been replaced must not land.
    let current = true
    get<Routine[]>('/api/routines')
      .then((loaded) => {
        if (current) setRoutines(loaded)
      })
      .catch((e: unknown) => {
        if (current) setError(e instanceof Error ? e.message : 'Could not load your recurring tasks.')
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

  const add = useCallback(
    async (form: RoutineForm): Promise<Result> => {
      const checked = check(form)
      if (!checked.ok) return checked
      try {
        const created = await post<Routine>(`/api/routines?today=${todayKey}`, body(form))
        setRoutines((prev) => [...prev, created])
        reloadDays()
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [todayKey, reloadDays],
  )

  const update = useCallback(
    async (id: string, form: RoutineForm): Promise<Result> => {
      const checked = check(form)
      if (!checked.ok) return checked
      try {
        const saved = await patch<Routine>(`/api/routines/${id}?today=${todayKey}`, body(form))
        setRoutines((prev) => prev.map((r) => (r.id === id ? saved : r)))
        reloadDays()
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [todayKey, reloadDays],
  )

  const remove = useCallback(
    async (id: string): Promise<Result> => {
      try {
        await del(`/api/routines/${id}?today=${todayKey}`)
        setRoutines((prev) => prev.filter((r) => r.id !== id))
        reloadDays()
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [todayKey, reloadDays],
  )

  const value = useMemo(
    () => ({ routines, loading, error, reload, add, update, remove }),
    [routines, loading, error, reload, add, update, remove],
  )

  return <RoutinesContext.Provider value={value}>{children}</RoutinesContext.Provider>
}
