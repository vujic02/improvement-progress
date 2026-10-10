import type { IconName } from '../components/Icon'
import type { Routine } from './routines'

/**
 * A pursuit is anything you are working towards over time: a saving, an
 * investment, a dream, a lift, a language. Two pages are built on this — money
 * (`#/savings`) and growth (`#/self-improvement`) — and they differ only in the
 * kinds on offer and the words around them, which is what a `PursuitArea` is.
 */
/**
 * A rung on the way. Growth goals and dreams write it in words (`label`); money
 * goals lay it out as a payment (`amount`) — a 6000 target as twelve steps of
 * 500 — and ticking one moves its amount into the balance. Exactly one is set.
 */
export interface PursuitStep {
  id: string
  label?: string
  amount?: number
  done: boolean
}

/**
 * A recurring task linked to a goal, with how it has gone. Mirrors the API's
 * `HabitResponse`.
 */
export interface Habit {
  routine: Routine
  /** Runs ticked in the last 30 days. */
  done: number
  /** Runs in the last 30 days, ticked or not. */
  due: number
  /** Consecutive runs ticked, counting back. An unticked today does not break it. */
  streak: number
  /** Today's copy exists and is not ticked yet. */
  dueToday: boolean
  /** yyyy-mm-dd. The most recent past day left unticked, if any. */
  lastMissed?: string
}

/**
 * One day's copy of a linked recurring task, listed among the goal's steps.
 * It is a day task: ticking it here ticks it in that day's list too. Runs are
 * shown, not counted — a daily task never finishes, so the progress bar stays
 * with the steps that were written down.
 */
export interface Run {
  /** The day task's id. */
  id: string
  routineId: string
  label: string
  /** yyyy-mm-dd. */
  day: string
  done: boolean
  /** Money goals only: what ticking it adds, or added. */
  amount?: number
}

export interface Pursuit {
  id: string
  name: string
  /**
   * One of its area's `kinds`. Kept loose here; the modal only offers valid
   * ones. Absent for areas that have no kinds — dreams pick an icon instead.
   */
  kind?: string
  /** Chosen from `PICKABLE_ICONS`, for areas that have no kinds. */
  icon?: IconName
  /** An https image address. Always run through `safeImageUrl` first. */
  image?: string
  /** What it costs, in the account's currency. Only areas with `money` ask for it. */
  target?: number
  /** Put aside so far, in the account's currency. Grows through `contribute`. */
  saved?: number
  /** yyyy-mm-dd. Defaults to today but the user may back-date it. */
  createdAt: string
  /** yyyy-mm-dd. When they want it finished. */
  targetAt: string
  steps: PursuitStep[]
  /** The recurring tasks linked to it. Every response carries them. */
  habits: Habit[]
  /**
   * Its linked tasks' runs: every unticked one and the last few ticked,
   * newest first. A money goal lists only runs that pay an amount of their
   * own — one that ticks a planned payment shows as that payment.
   */
  runs: Run[]
}

/** Names are capped at this length in the create modal. */
export const PURSUIT_NAME_MAX = 40

/** Steps get more room than names — they read as short sentences. */
export const STEP_NAME_MAX = 60

/** Payments added in one go: 500 × 60 is five years of months. */
export const STEP_BATCH_MAX = 60

/** How far ahead the target date starts when the modal opens. */
export const DEFAULT_TARGET_MONTHS = 6

export interface PursuitKindMeta {
  label: string
  /** Plural, for filter tabs. Not always `label` + "s" — "Training" is both. */
  plural: string
  /**
   * Heading on this kind's money stat card. Past tense, and not derivable —
   * "Saving" becomes "Saved", "Investment" becomes "Invested".
   */
  statLabel?: string
  /**
   * Money that leaves and stays gone. Its stat still tints with the kind
   * colour, but the percentage is not shown in gain-green: paying more bills
   * is progress, not profit.
   */
  spend?: boolean
  /** One line under the label in the modal picker and the empty screen. */
  blurb: string
  icon: IconName
  color: string
}

/**
 * Everything that makes one pursuit page different from the other: its kinds,
 * and the copy wrapped around them. Adding a third area means adding one of
 * these and a two-line page — not another copy of the card, modal and grid.
 */
export interface PursuitArea {
  /** Sidebar item to mark current. */
  navId: string
  /** Page heading, last breadcrumb and navbar title. */
  title: string
  blurb: string
  kinds: readonly string[]
  meta: Record<string, PursuitKindMeta>
  /** Button that opens the modal. */
  newLabel: string
  modalTitle: string
  modalSubtitle: string
  namePlaceholder: string
  /** Placeholder in a card's add-a-step field. */
  stepPlaceholder?: string
  /** Shown on a card that has no steps yet. */
  noSteps?: string
  emptyTitle: string
  emptyText: string
  emptyCta: string
  /**
   * The area deals in money: the modal asks for a target and a starting
   * balance, cards take contributions, and steps are payments rather than
   * words. Growth goals and dreams do not — a bench press has no price.
   */
  money?: boolean
}

/**
 * The currencies an account can show its money in, mirroring the server's
 * `Currency` enum. **Switching relabels, it never converts** — 500 in euros
 * becomes 500 in pounds. There are no exchange rates anywhere in the app.
 */
export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'RSD'] as const

export type CurrencyCode = (typeof CURRENCIES)[number]

/** Every account starts here, and so did every account before the setting existed. */
export const DEFAULT_CURRENCY: CurrencyCode = 'EUR'

/**
 * Anything larger is a typo, not a savings goal. Guards the formatter and the
 * progress maths from a stray paste of digits.
 */
export const MAX_AMOUNT = 1_000_000_000

const formats = new Map<CurrencyCode, Intl.NumberFormat>()

/**
 * One formatter per currency, built on first use. Same locale for all of them
 * so grouping reads the same whichever is picked; `narrowSymbol` gives "$"
 * rather than "US$". CHF and RSD have no narrower form and show their code.
 */
function moneyFormat(currency: CurrencyCode): Intl.NumberFormat {
  let format = formats.get(currency)
  if (!format) {
    format = new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
    formats.set(currency, format)
  }
  return format
}

/** 10000 in EUR becomes "€10,000"; 2499.5 in GBP becomes "£2,499.5". */
export function formatMoney(value: number, currency: CurrencyCode): string {
  return moneyFormat(currency).format(value)
}

/** "€", "$", "£", "CHF", "RSD" — the prefix on amount fields. */
export function currencySymbol(currency: CurrencyCode): string {
  return (
    moneyFormat(currency)
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? currency
  )
}

/** Reads an amount field. Returns null for blank, NaN for anything unusable. */
export function parseAmount(raw: string): number | null {
  const value = raw.trim()
  if (!value) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : Number.NaN
}

/** Looks up a kind's meta, falling back to the first kind for unknown ones. */
export function kindMeta(area: PursuitArea, kind: string | undefined): PursuitKindMeta {
  return (kind ? area.meta[kind] : undefined) ?? area.meta[area.kinds[0]]
}

/**
 * Normalises a user-typed image address, or returns null if it is not one we
 * are willing to render.
 *
 * **https only, on purpose.** The app has no server, so a pasted URL is never
 * fetched by us and there is no SSRF to worry about — but the value is user
 * input rendered into an attribute, so the scheme is pinned here rather than
 * trusted at the point of use. It must only ever reach an `<img src>`: put one
 * of these in an `href`, a `style`, or a CSS `url()` and the guarantee is gone.
 * `javascript:` does not execute from `src` in any current browser; blocking
 * it here means it also cannot leak into somewhere it would.
 */
export function safeImageUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}
