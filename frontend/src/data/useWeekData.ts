import { useMemo } from 'react'
import type { DayTask } from '../days/context'
import { DAY_NAMES, shortDate, toDateInput } from '../lib/date'
import { WEEK_TINTS, type TaskType } from './taskTypes'

export interface WeekTask {
  key: string
  label: string
  color: string
  type: string
  done: boolean
}

export interface WeekDay {
  key: string
  name: string
  short: string
  date: string
  pct: number
  tint: string
  items: WeekTask[]
  doneCount: number
  isToday: boolean
  future: boolean
  badge: string
  badgeColor: string
}

export interface WeekData {
  days: WeekDay[]
  total: number
  done: number
  pct: number
  startLabel: string
}

const UNKNOWN_COLOR = 'var(--text-muted)'

/**
 * The seven days of the week containing `now`, Sunday-first, from the tasks
 * the store holds. A day with nothing logged is shown as empty rather than
 * filled in — the tracker reports what happened, it does not invent it.
 */
export function useWeekData(now: Date, types: TaskType[], tasks: DayTask[]): WeekData {
  return useMemo(() => {
    const today = now.getDate()
    const start = new Date(now.getFullYear(), now.getMonth(), today - now.getDay())
    const typeOf = (id: string) => types.find((type) => type.id === id)

    const days: WeekDay[] = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      const key = toDateInput(dt)
      const isToday = dt.getDate() === today && dt.getMonth() === now.getMonth()
      const future = dt > now && !isToday

      const items: WeekTask[] = tasks
        .filter((task) => task.day === key)
        .map((task) => {
          const type = typeOf(task.typeId)
          return {
            key: task.id,
            label: task.label,
            color: type?.color ?? UNKNOWN_COLOR,
            type: type?.label ?? 'Removed type',
            done: task.done,
          }
        })

      const doneCount = items.filter((x) => x.done).length
      const name = DAY_NAMES[dt.getDay()]

      return {
        key,
        name,
        short: name.slice(0, 3),
        date: shortDate(dt),
        pct: items.length ? Math.round((doneCount / items.length) * 100) : 0,
        tint: WEEK_TINTS[i % WEEK_TINTS.length],
        items,
        doneCount,
        isToday,
        future,
        badge: isToday ? 'Today' : future ? 'Ahead' : items.length ? 'Logged' : 'Empty',
        badgeColor: isToday
          ? 'var(--accent)'
          : future || !items.length
            ? 'rgba(255,255,255,.08)'
            : 'rgba(1,181,116,.22)',
      }
    })

    const total = days.reduce((a, d) => a + d.items.length, 0)
    const done = days.reduce((a, d) => a + d.doneCount, 0)

    return {
      days,
      total,
      done,
      pct: Math.round((done / Math.max(1, total)) * 100),
      startLabel: days[0].date,
    }
  }, [now, types, tasks])
}
