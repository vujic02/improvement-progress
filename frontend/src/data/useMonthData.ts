import { useMemo } from 'react'
import type { DayTask } from '../days/context'
import { DAY_LETTERS, toDateInput } from '../lib/date'
import { WEEK_TINTS, type TaskType } from './taskTypes'
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
 * The habit grid for `now`'s month, built from the tasks the store holds.
 *
 * <p>A cell is filled when a task of that type is done on that day — there is
 * no separate tick, so the grid and the day's list can never disagree. Cells
 * are read-only; logging happens in today's list.
 *
 * <p>**Rows are the types this month actually used**, not all 22 available. A
 * type you have never logged is not a habit you are failing at, and a grid of
 * mostly empty rows says nothing. `rows` is empty until something is logged,
 * and the page drops the whole section rather than show an empty frame.
 */
export function useMonthData(now: Date, types: TaskType[], tasks: DayTask[]): MonthData {
  return useMemo(() => {
    const today = now.getDate()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstWeekday = new Date(year, month, 1).getDay()

    // The store holds the current week too, which can reach into last month.
    const from = toDateInput(new Date(year, month, 1))
    const to = toDateInput(new Date(year, month, daysInMonth))
    const inMonth = tasks.filter((task) => task.day >= from && task.day <= to)

    // "type|yyyy-mm-dd" for every type done that day. One pass, then the grid
    // is a lookup per cell rather than a scan of every task.
    const done = new Set(
      inMonth.filter((task) => task.done).map((task) => `${task.typeId}|${task.day}`),
    )
    const isDone = (typeId: string, day: number) =>
      done.has(`${typeId}|${toDateInput(new Date(year, month, day))}`)

    // Logged at all, done or not: a type you tried and missed is still a row.
    const logged = new Set(inMonth.map((task) => task.typeId))
    const used = types.filter((type) => logged.has(type.id))

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

    const rows: HabitRow[] = used.map((type) => {
      const cells: HabitCell[] = days.map((day) => ({
        key: `${type.id}-${day.d}`,
        day: day.d,
        filled: isDone(type.id, day.d),
        future: day.future,
        tint: day.tint,
      }))
      const elapsed = days.filter((x) => !x.future).length
      const hit = days.filter((x) => !x.future && isDone(type.id, x.d)).length
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
      // A day scores on how many of the month's habits it touched, not how many
      // tasks: four runs is one habit kept, not four.
      const hits = used.filter((type) => isDone(type.id, day.d)).length
      const pct = day.future ? 0 : Math.round((hits / Math.max(1, used.length)) * 100)
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
  }, [now, types, tasks])
}
