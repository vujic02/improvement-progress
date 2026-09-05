import { useMemo } from 'react'
import { DAY_NAMES, shortDate } from '../lib/date'
import { seeded } from '../lib/seeded'
import { DEFAULT_TASK_TYPES, WEEK_TINTS } from './taskTypes'
import { WEEK_TASK_POOL } from './tasks'

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
  energy: number
  focus: number
  motivation: number
}

export interface WeekData {
  days: WeekDay[]
  total: number
  done: number
  pct: number
  startLabel: string
}

/**
 * Seven seeded days for the week containing `now`, Sunday-first. Mock labels
 * only exist for the default types, so this samples WEEK_TASK_POOL rather than
 * the user's full list.
 */
export function useWeekData(now: Date): WeekData {
  return useMemo(() => {
    const today = now.getDate()
    const start = new Date(now.getFullYear(), now.getMonth(), today - now.getDay())

    const days: WeekDay[] = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      const isToday = dt.getDate() === today && dt.getMonth() === now.getMonth()
      const future = dt > now && !isToday

      const items: WeekTask[] = []
      for (let k = 0; k < 4; k++) {
        const ti = Math.floor(seeded(i + 2, k + 5) * WEEK_TASK_POOL.length)
        const pool = WEEK_TASK_POOL[ti]
        items.push({
          key: `${i}-${k}`,
          label: pool[Math.floor(seeded(i + 7, k + 1) * pool.length)],
          color: DEFAULT_TASK_TYPES[ti].color,
          type: DEFAULT_TASK_TYPES[ti].label,
          done: !future && seeded(i + 11, k + 3) > 0.42,
        })
      }

      const doneCount = items.filter((x) => x.done).length
      const name = DAY_NAMES[dt.getDay()]

      return {
        key: `d${i}`,
        name,
        short: name.slice(0, 3),
        date: shortDate(dt),
        pct: future ? 0 : Math.round((doneCount / items.length) * 100),
        tint: WEEK_TINTS[i % WEEK_TINTS.length],
        items,
        doneCount,
        isToday,
        future,
        badge: isToday ? 'Today' : future ? 'Ahead' : 'Logged',
        badgeColor: isToday
          ? 'var(--accent)'
          : future
            ? 'rgba(255,255,255,.08)'
            : 'rgba(1,181,116,.22)',
        energy: Math.round(4 + seeded(i, 21) * 6),
        focus: Math.round(4 + seeded(i, 22) * 6),
        motivation: Math.round(4 + seeded(i, 23) * 6),
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
  }, [now])
}
