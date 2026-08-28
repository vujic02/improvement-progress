import { useCallback, useMemo, useState } from 'react'
import { DAY_LETTERS } from '../lib/date'
import { seeded } from '../lib/seeded'
import { TASK_TYPES, WEEK_TINTS } from './taskTypes'
import type { IconName } from '../components/Icon'

export interface MonthDay {
  d: number
  weekday: number
  letter: string
  weekIdx: number
  tint: string
  isToday: boolean
  future: boolean
  numColor: string
  /** height of the daily-score bar, as a css length */
  scoreHeight: string
  scoreColor: string
}

export interface MonthWeek {
  idx: number
  label: string
  tint: string
  span: number
}

export interface HabitCell {
  key: string
  day: number
  filled: boolean
  future: boolean
  tint: string
  toggle: () => void
}

export interface HabitRow {
  id: string
  label: string
  color: string
  icon: IconName
  cells: HabitCell[]
  hit: number
  elapsed: number
  pct: number
}

export interface MonthData {
  days: MonthDay[]
  weeks: MonthWeek[]
  rows: HabitRow[]
  monthPct: number
  /** grid-template-columns shared by every row of the habit grid */
  gridCols: string
}

/**
 * Builds the habit grid for `now`'s month. Cells default to a seeded value so
 * the grid looks lived-in; user toggles are held in local state and win.
 */
export function useMonthData(now: Date): MonthData {
  const [checks, setChecks] = useState<Record<string, boolean>>({})

  const isChecked = useCallback(
    (typeIdx: number, day: number, today: number) => {
      const key = `${typeIdx}-${day}`
      if (checks[key] !== undefined) return checks[key]
      return day <= today && seeded(typeIdx + 1, day) > 0.36
    },
    [checks],
  )

  const toggle = useCallback((typeIdx: number, day: number, current: boolean) => {
    setChecks((prev) => ({ ...prev, [`${typeIdx}-${day}`]: !current }))
  }, [])

  return useMemo(() => {
    const today = now.getDate()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstWeekday = new Date(year, month, 1).getDay()

    const days: MonthDay[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const weekday = new Date(year, month, d).getDay()
      const weekIdx = Math.floor((d + firstWeekday - 1) / 7)
      days.push({
        d,
        weekday,
        letter: DAY_LETTERS[weekday],
        weekIdx,
        tint: WEEK_TINTS[weekIdx % WEEK_TINTS.length],
        isToday: d === today,
        future: d > today,
        numColor: '',
        scoreHeight: '',
        scoreColor: '',
      })
    }

    const weeks: MonthWeek[] = []
    for (const day of days) {
      if (!weeks[day.weekIdx]) {
        weeks[day.weekIdx] = {
          idx: day.weekIdx,
          label: `Week ${day.weekIdx + 1}`,
          tint: day.tint,
          span: 0,
        }
      }
      weeks[day.weekIdx].span += 1
    }

    const rows: HabitRow[] = TASK_TYPES.map((type, ti) => {
      const cells: HabitCell[] = days.map((day) => {
        const filled = isChecked(ti, day.d, today)
        return {
          key: `${ti}-${day.d}`,
          day: day.d,
          filled,
          future: day.future,
          tint: day.tint,
          toggle: () => toggle(ti, day.d, filled),
        }
      })
      const elapsed = days.filter((x) => !x.future).length
      const hit = days.filter((x) => !x.future && isChecked(ti, x.d, today)).length
      return {
        id: type.id,
        label: type.label,
        color: type.color,
        icon: type.icon,
        cells,
        hit,
        elapsed,
        pct: Math.round((hit / Math.max(1, elapsed)) * 100),
      }
    })

    for (const day of days) {
      const hits = TASK_TYPES.filter((_, ti) => isChecked(ti, day.d, today)).length
      const pct = day.future ? 0 : Math.round((hits / TASK_TYPES.length) * 100)
      day.numColor = day.isToday
        ? 'var(--accent)'
        : day.future
          ? 'rgba(160,174,192,.55)'
          : 'var(--text)'
      day.scoreHeight = day.future ? '3px' : `${Math.max(8, pct)}%`
      day.scoreColor = day.future ? 'var(--line)' : day.tint
    }

    const allElapsed = rows.reduce((a, r) => a + r.elapsed, 0)
    const allHit = rows.reduce((a, r) => a + r.hit, 0)

    return {
      days,
      weeks: weeks.filter(Boolean),
      rows,
      monthPct: Math.round((allHit / Math.max(1, allElapsed)) * 100),
      gridCols: `196px repeat(${days.length}, minmax(0, 1fr))`,
    }
  }, [now, isChecked, toggle])
}
