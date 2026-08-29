import type { PursuitArea, PursuitKindMeta } from './pursuits'

/**
 * Nine kinds, matching the shape of the day the tracker already scores.
 * Colours and icons are deliberately the same ones `DEFAULT_TASK_TYPES` uses
 * for the equivalent category, so a growth goal and its task type read as the
 * same thing.
 */
export const GROWTH_KINDS = [
  'learning',
  'training',
  'nutrition',
  'reading',
  'mind',
  'creative',
  'career',
  'social',
  'health',
] as const

export type GrowthKind = (typeof GROWTH_KINDS)[number]

export const GROWTH_KIND_META: Record<GrowthKind, PursuitKindMeta> = {
  learning: {
    label: 'Learning',
    plural: 'Learning',
    blurb: 'A skill, a language, a stack — anything you are studying.',
    icon: 'documentText',
    color: 'var(--accent-violet)',
  },
  training: {
    label: 'Training',
    plural: 'Training',
    blurb: 'Strength, endurance, movement. The gym and everything like it.',
    icon: 'rocket',
    color: 'var(--accent-green)',
  },
  nutrition: {
    label: 'Nutrition',
    plural: 'Nutrition',
    blurb: 'Eating well, and the habits that make it stick.',
    icon: 'leaf',
    color: 'var(--accent-lime)',
  },
  reading: {
    label: 'Reading',
    plural: 'Reading',
    blurb: 'Books, papers, the pile you keep meaning to start.',
    icon: 'book',
    color: 'var(--accent-amber)',
  },
  mind: {
    label: 'Mindset',
    plural: 'Mindset',
    blurb: 'Sleep, focus and the habits holding the rest of it up.',
    icon: 'tagFaces',
    color: 'var(--accent-teal)',
  },
  creative: {
    label: 'Creative',
    plural: 'Creative',
    blurb: 'Making things — side projects, music, writing.',
    icon: 'bulb',
    color: 'var(--accent-orange)',
  },
  career: {
    label: 'Career',
    plural: 'Career',
    blurb: 'The craft and the moves that push the work forward.',
    icon: 'build',
    color: 'var(--accent)',
  },
  social: {
    label: 'Social',
    plural: 'Social',
    blurb: 'Family, friends, the people you keep meaning to call.',
    icon: 'people',
    color: 'var(--accent-pink)',
  },
  health: {
    label: 'Health',
    plural: 'Health',
    blurb: 'Checkups, recovery, the body admin you keep putting off.',
    icon: 'heart',
    color: 'var(--accent-rose)',
  },
}

export const GROWTH_AREA: PursuitArea = {
  navId: 'self',
  title: 'Self-improvement',
  blurb:
    'The things you are getting better at. Set the target, then lay out the steps between here and it.',
  kinds: GROWTH_KINDS,
  meta: GROWTH_KIND_META,
  newLabel: 'New goal',
  modalTitle: 'New goal',
  modalSubtitle: 'Name what you are after, say what kind it is, and give it a date to be done by.',
  namePlaceholder: 'e.g. Bench 100kg',
  stepPlaceholder: 'Add a step…',
  noSteps: 'No steps yet. Lay out the rungs — each one small enough to actually tick off.',
  emptyTitle: 'Nothing in progress yet',
  emptyText:
    'Pick one thing you want to be better at by the end of the year — a lift, a language, a stack, a habit — and break it into steps you can tick off on the way.',
  emptyCta: 'Add your first goal',
}
