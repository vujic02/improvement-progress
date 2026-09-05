import type { PursuitArea, PursuitKindMeta } from './pursuits'

/**
 * Four kinds, and each one is a line on the stats row. Two grow what you have,
 * two shrink what you owe — which is why `spend` exists: paying more bills is
 * progress, but it is not a gain, and it should not be coloured like one.
 *
 * There is no `dream` kind here. Dreams have their own page (`#/dreams`),
 * where they get a picture instead of a price.
 */
export const SAVINGS_KINDS = ['saving', 'investment', 'debt', 'bills'] as const

export type SavingsKind = (typeof SAVINGS_KINDS)[number]

export const SAVINGS_KIND_META: Record<SavingsKind, PursuitKindMeta> = {
  saving: {
    label: 'Saving',
    plural: 'Savings',
    statLabel: 'Saved',
    blurb: 'Money set aside for something specific.',
    icon: 'wallet',
    color: 'var(--accent-cyan)',
  },
  investment: {
    label: 'Investment',
    plural: 'Investments',
    statLabel: 'Invested',
    blurb: 'Money put to work — funds, stocks, property.',
    icon: 'statsChart',
    color: 'var(--accent-green)',
  },
  debt: {
    label: 'Debt',
    plural: 'Debt',
    statLabel: 'Debt paid off',
    blurb: 'Loans and cards you are paying down.',
    icon: 'flame',
    color: 'var(--accent-violet)',
  },
  bills: {
    label: 'Bills & chores',
    plural: 'Bills',
    statLabel: 'Bills & chores',
    blurb: 'Rent, subscriptions, the admin that just has to be paid.',
    icon: 'documentText',
    color: 'var(--accent-amber)',
    spend: true,
  },
}

export const SAVINGS_AREA: PursuitArea = {
  navId: 'savings',
  title: 'Savings & investing',
  blurb:
    'Every saving, investment, debt and bill in one place. Give each one a number and a finish line, then log what you put against it.',
  kinds: SAVINGS_KINDS,
  meta: SAVINGS_KIND_META,
  newLabel: 'New goal',
  modalTitle: 'New goal',
  modalSubtitle: 'Name it, say what it is, and give it a number to hit by a date.',
  namePlaceholder: 'e.g. Emergency fund',
  emptyTitle: 'Nothing tracked yet',
  emptyText:
    "Start with one thing you're putting money against — a buffer, a first investment, a card you want gone. Set what it costs, then log what you pay in.",
  emptyCta: 'Add your first goal',
  money: true,
  steps: false,
}
