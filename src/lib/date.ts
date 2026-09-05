export const DAY_LETTERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/**
 * Three buckets, local time:
 *   05:00–11:59  Good morning
 *   12:00–17:59  Good day
 *   18:00–04:59  Good evening
 */
export function salutation(now: Date = new Date()): string {
  const h = now.getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good day'
  return 'Good evening'
}

export function monthTitle(now: Date): string {
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
}

/** dd.mm.yyyy */
export function shortDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export function bootStamp(now: Date): string {
  const mon = MONTHS[now.getMonth()].slice(0, 3).toUpperCase()
  return `${DAY_NAMES[now.getDay()]} · ${now.getDate()} ${mon} ${now.getFullYear()}`
}

/** yyyy-mm-dd — the value an `<input type="date">` reads and writes. */
export function toDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Parses yyyy-mm-dd at local midnight. `new Date(value)` would read it as UTC
 * and land on the previous day for anyone west of Greenwich.
 */
export function parseDateInput(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return Number.isNaN(date.getTime()) ? null : date
}

/** Whole days from `from` to `to`, ignoring the time of day. Negative = past. */
export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** "12 Apr 2027" — the long-form date used on goal cards. */
export function mediumDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}
