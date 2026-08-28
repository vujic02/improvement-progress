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
