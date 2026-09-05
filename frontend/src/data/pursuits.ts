import type { IconName } from '../components/Icon'

/**
 * A pursuit is anything you are working towards over time: a saving, an
 * investment, a dream, a lift, a language. Two pages are built on this — money
 * (`#/savings`) and growth (`#/self-improvement`) — and they differ only in the
 * kinds on offer and the words around them, which is what a `PursuitArea` is.
 */
export interface PursuitStep {
  id: string
  label: string
  done: boolean
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
  /** What it costs, in `CURRENCY`. Only areas with `money` ask for it. */
  target?: number
  /** Put aside so far, in `CURRENCY`. Grows through `contribute`. */
  saved?: number
  /** yyyy-mm-dd. Defaults to today but the user may back-date it. */
  createdAt: string
  /** yyyy-mm-dd. When they want it finished. */
  targetAt: string
  steps: PursuitStep[]
}

/** Names are capped at this length in the create modal. */
export const PURSUIT_NAME_MAX = 40

/** Steps get more room than names — they read as short sentences. */
export const STEP_NAME_MAX = 60

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
  /**
   * The area breaks its pursuits into steps. Defaults to true; savings sets it
   * false — a savings goal is measured by its balance, and a checklist beside
   * that is two answers to the same question.
   */
  steps?: boolean
  /** Placeholder in a card's add-a-step field. Step areas only. */
  stepPlaceholder?: string
  /** Shown on a card that has no steps yet. Step areas only. */
  noSteps?: string
  emptyTitle: string
  emptyText: string
  emptyCta: string
  /**
   * The area deals in money: the modal asks for a target and a starting
   * balance, and cards take contributions. Growth goals and dreams do not —
   * a bench press has no price.
   */
  money?: boolean
}

/**
 * Euros, for now. One constant so switching later — or making it a per-user
 * setting — is a single edit rather than a search for "€".
 */
export const CURRENCY = 'EUR'

/**
 * Anything larger is a typo, not a savings goal. Guards the formatter and the
 * progress maths from a stray paste of digits.
 */
export const MAX_AMOUNT = 1_000_000_000

const MONEY_FORMAT = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** 10000 becomes "€10,000"; 2499.5 becomes "€2,499.5". */
export function formatMoney(value: number): string {
  return MONEY_FORMAT.format(value)
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
