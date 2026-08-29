import type { IconName } from '../components/Icon'

/**
 * Three kinds, deliberately. A saving is money set aside, an investment is
 * money put to work, a dream is the thing with no price tag yet. Anything
 * finer than that is a tag, not a kind.
 */
export const GOAL_KINDS = ['saving', 'investment', 'dream'] as const

export type GoalKind = (typeof GOAL_KINDS)[number]

export interface GoalStep {
  id: string
  label: string
  done: boolean
}

export interface Goal {
  id: string
  name: string
  kind: GoalKind
  /** yyyy-mm-dd. Defaults to today but the user may back-date it. */
  createdAt: string
  /** yyyy-mm-dd. When they want it finished. */
  targetAt: string
  steps: GoalStep[]
}

/** Names are capped at this length in the create modal. */
export const GOAL_NAME_MAX = 40

/** Steps get more room than names — they read as short sentences. */
export const STEP_NAME_MAX = 60

export interface GoalKindMeta {
  label: string
  /** Sits under the field label in the modal picker. */
  blurb: string
  icon: IconName
  color: string
}

export const GOAL_KIND_META: Record<GoalKind, GoalKindMeta> = {
  saving: {
    label: 'Saving',
    blurb: 'Money set aside for something specific.',
    icon: 'wallet',
    color: 'var(--accent-cyan)',
  },
  investment: {
    label: 'Investment',
    blurb: 'Money put to work — funds, stocks, property.',
    icon: 'statsChart',
    color: 'var(--accent-green)',
  },
  dream: {
    label: 'Dream',
    blurb: 'The long shot. No price tag needed yet.',
    icon: 'star',
    color: 'var(--accent-violet)',
  },
}

/** How far ahead the target date starts when the modal opens. */
export const DEFAULT_TARGET_MONTHS = 6
