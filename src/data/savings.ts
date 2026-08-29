import type { PursuitArea, PursuitKindMeta } from './pursuits'

/**
 * Three kinds, deliberately. A saving is money set aside, an investment is
 * money put to work, a dream is the thing with no price tag yet. Anything
 * finer than that is a tag, not a kind.
 */
export const SAVINGS_KINDS = ['saving', 'investment', 'dream'] as const

export type SavingsKind = (typeof SAVINGS_KINDS)[number]

export const SAVINGS_KIND_META: Record<SavingsKind, PursuitKindMeta> = {
  saving: {
    label: 'Saving',
    plural: 'Savings',
    blurb: 'Money set aside for something specific.',
    icon: 'wallet',
    color: 'var(--accent-cyan)',
  },
  investment: {
    label: 'Investment',
    plural: 'Investments',
    blurb: 'Money put to work — funds, stocks, property.',
    icon: 'statsChart',
    color: 'var(--accent-green)',
  },
  dream: {
    label: 'Dream',
    plural: 'Dreams',
    blurb: 'The long shot. No price tag needed yet.',
    icon: 'star',
    color: 'var(--accent-violet)',
  },
}

export const SAVINGS_AREA: PursuitArea = {
  navId: 'savings',
  title: 'Savings & investing',
  blurb:
    'Every saving, investment and dream in one place. Give each one a finish line, then break it into the steps that actually move it.',
  kinds: SAVINGS_KINDS,
  meta: SAVINGS_KIND_META,
  newLabel: 'New goal',
  modalTitle: 'New goal',
  modalSubtitle: 'Name it, say what it is, and give it a finish line. Steps come after.',
  namePlaceholder: 'e.g. Emergency fund',
  stepPlaceholder: 'Add a step…',
  noSteps: 'No steps yet. Break it into the things you actually have to do.',
  emptyTitle: 'Nothing saved for yet',
  emptyText:
    "Start with one thing you're putting money towards — a buffer, a first investment, or the trip you keep talking about. You can add steps to it once it exists.",
  emptyCta: 'Add your first goal',
}
