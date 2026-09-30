import { DAY_NAMES } from '../lib/date'

/**
 * How often a routine repeats. Mirrors the server's `RoutineCadence` wire
 * names, in the order the picker lists them.
 */
export const CADENCES = [
  'daily',
  'weekly',
  'month-first',
  'month-last',
  'month-day',
  'every-n-days',
  'every-n-weeks',
] as const

export type Cadence = (typeof CADENCES)[number]

export const CADENCE_LABELS: Record<Cadence, string> = {
  daily: 'Every day',
  weekly: 'On chosen weekdays',
  'month-first': '1st of the month',
  'month-last': 'Last day of the month',
  'month-day': 'A day of the month',
  'every-n-days': 'Every few days',
  'every-n-weeks': 'Every few weeks',
}

/**
 * A recurring task. Only a template: each day it runs on gets an ordinary day
 * task, filled in by the server when the days are read. Fields a cadence does
 * not use are absent.
 */
export interface Routine {
  id: string
  typeId: string
  label: string
  cadence: Cadence
  /** 0–6, Sunday first. Weekly and every-n-weeks. */
  weekdays?: number[]
  /** 1–31; the 31st falls back to the last day of a short month. Month-day only. */
  dayOfMonth?: number
  /** Every-n-days and every-n-weeks. */
  interval?: number
  /** yyyy-mm-dd. Every-n schedules count from here. */
  startsOn: string
}

export type RoutineForm = Omit<Routine, 'id' | 'startsOn'>

/** Per account, as the server enforces. */
export const ROUTINES_MAX = 50
export const DAYS_INTERVAL_MAX = 365
export const WEEKS_INTERVAL_MAX = 52

/** Uses weekdays — both kinds of week schedule. */
export const usesWeekdays = (cadence: Cadence) => cadence === 'weekly' || cadence === 'every-n-weeks'

/** Uses an interval — the two every-n schedules. */
export const usesInterval = (cadence: Cadence) =>
  cadence === 'every-n-days' || cadence === 'every-n-weeks'

/** 1 becomes "1st", 22 "22nd", 13 "13th". */
export function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/** "Mon, Wed, Fri" — or the shorthand when the days make a familiar set. */
function weekdayList(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b)
  const key = sorted.join(',')
  if (key === '0,1,2,3,4,5,6') return 'every day'
  if (key === '1,2,3,4,5') return 'weekdays'
  if (key === '0,6') return 'weekends'
  return sorted.map((day) => DAY_NAMES[day].slice(0, 3)).join(', ')
}

/** The schedule in the words a card shows: "Every day", "Mon, Wed, Fri", "Every 2 weeks on Sun". */
export function scheduleText(routine: Pick<Routine, 'cadence' | 'weekdays' | 'dayOfMonth' | 'interval'>): string {
  const { cadence, weekdays = [], dayOfMonth, interval } = routine
  switch (cadence) {
    case 'daily':
      return 'Every day'
    case 'weekly': {
      const days = weekdayList(weekdays)
      return days === 'every day' ? 'Every day' : `Every ${days}`
    }
    case 'month-first':
      return '1st of every month'
    case 'month-last':
      return 'Last day of every month'
    case 'month-day':
      return dayOfMonth ? `The ${ordinal(dayOfMonth)} of every month` : 'A day of the month'
    case 'every-n-days':
      return interval ? `Every ${interval} days` : 'Every few days'
    case 'every-n-weeks':
      return `Every ${interval ?? 'few'} weeks${weekdays.length ? ` on ${weekdayList(weekdays)}` : ''}`
  }
}
