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
  /** One of its area's `kinds`. Kept loose here; the modal only offers valid ones. */
  kind: string
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
  stepPlaceholder: string
  /** Shown on a card that has no steps yet. */
  noSteps: string
  emptyTitle: string
  emptyText: string
  emptyCta: string
}

/** Looks up a kind's meta, falling back to the first kind for unknown ones. */
export function kindMeta(area: PursuitArea, kind: string): PursuitKindMeta {
  return area.meta[kind] ?? area.meta[area.kinds[0]]
}
