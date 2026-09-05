import type { IconName } from '../components/Icon'
import { DAY_NAMES } from '../lib/date'

/**
 * How often a reminder fires. `event` ones have no schedule at all — they go
 * out when the thing they watch for actually happens.
 */
export const CADENCES = ['daily', 'weekly', 'monthly'] as const

export type Cadence = (typeof CADENCES)[number]

export type ReminderGroup = 'money' | 'days' | 'account'

export interface Reminder {
  id: string
  title: string
  /** One line under the title, in the settings list and the notification. */
  body: string
  icon: IconName
  color: string
  group: ReminderGroup
  /** `event` reminders have no cadence controls — they fire when they fire. */
  scheduled: boolean
  enabled: boolean
  cadence: Cadence
  /** 0–6, Sunday first. Only read when the cadence is weekly. */
  weekday: number
  /** 1–28. Only read when the cadence is monthly. */
  dayOfMonth: number
  /** 24-hour "HH:MM", the value an `<input type="time">` speaks. */
  time: string
}

/**
 * Monthly reminders stop at the 28th so every month has the day. A "last day
 * of the month" option would need its own value, not a number.
 */
export const MONTH_DAY_MAX = 28

export const REMINDER_GROUPS: { id: ReminderGroup; label: string; blurb: string }[] = [
  { id: 'money', label: 'Money', blurb: 'Savings, investments and the goals behind them.' },
  { id: 'days', label: 'Your days', blurb: 'Tasks, streaks and the weekly look-back.' },
  { id: 'account', label: 'Account', blurb: 'Changes to Kaizen and to your sign-in.' },
]

const base = {
  scheduled: true,
  cadence: 'monthly' as Cadence,
  weekday: 0,
  dayOfMonth: 1,
  time: '09:00',
}

export const DEFAULT_REMINDERS: Reminder[] = [
  {
    ...base,
    id: 'investment-review',
    title: 'Investment check-in',
    body: 'Time to look over how your investments are tracking.',
    icon: 'statsChart',
    color: 'var(--accent-green)',
    group: 'money',
    enabled: true,
    cadence: 'monthly',
    dayOfMonth: 1,
    time: '09:00',
  },
  {
    ...base,
    id: 'savings-topup',
    title: 'Savings top-up',
    body: "Move this month's amount into a savings goal.",
    icon: 'wallet',
    color: 'var(--accent-cyan)',
    group: 'money',
    enabled: true,
    cadence: 'monthly',
    dayOfMonth: 25,
    time: '10:00',
  },
  {
    ...base,
    id: 'goal-deadline',
    title: 'Goal deadline nearby',
    body: "A goal's target date is a week out.",
    icon: 'target',
    color: 'var(--accent-violet)',
    group: 'money',
    scheduled: false,
    enabled: true,
  },
  {
    ...base,
    id: 'daily-check',
    title: 'Daily check-in',
    body: "A nudge to tick off what you got done today.",
    icon: 'checkmarkCircle',
    color: 'var(--accent)',
    group: 'days',
    enabled: true,
    cadence: 'daily',
    time: '20:00',
  },
  {
    ...base,
    id: 'weekly-review',
    title: 'Weekly review',
    body: 'Sit down with the week you just had.',
    icon: 'documents',
    color: 'var(--accent-teal)',
    group: 'days',
    enabled: true,
    cadence: 'weekly',
    weekday: 0,
    time: '18:00',
  },
  {
    ...base,
    id: 'streak-risk',
    title: 'Streak at risk',
    body: 'The day is nearly over and nothing is ticked off.',
    icon: 'flame',
    color: 'var(--accent-orange)',
    group: 'days',
    scheduled: false,
    enabled: false,
  },
  {
    ...base,
    id: 'product-updates',
    title: 'Product updates',
    body: 'New features and changes in Kaizen.',
    icon: 'bulb',
    color: 'var(--accent-amber)',
    group: 'account',
    scheduled: false,
    enabled: false,
  },
  {
    ...base,
    id: 'security-alerts',
    title: 'Security alerts',
    body: 'Sign-ins from a new device, and password changes.',
    icon: 'key',
    color: 'var(--accent-rose)',
    group: 'account',
    scheduled: false,
    enabled: true,
  },
]

/** 1 → "1st", 22 → "22nd". Used for the day of the month. */
export function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

/** The one-line schedule shown on the row and inside the notification. */
export function cadenceSummary(reminder: Reminder): string {
  if (!reminder.scheduled) return 'As it happens'
  switch (reminder.cadence) {
    case 'daily':
      return `Every day · ${reminder.time}`
    case 'weekly':
      return `Every ${DAY_NAMES[reminder.weekday]} · ${reminder.time}`
    case 'monthly':
      return `Monthly on the ${ordinal(reminder.dayOfMonth)} · ${reminder.time}`
  }
}
