import type { IconName } from '../components/Icon'

/**
 * Dreams have no kinds. A dream house and a dream sabbatical are not usefully
 * different categories — what distinguishes one is the picture of it. So the
 * create form asks for a name, an icon, and optionally an image address.
 */
export const DREAM_ICONS: IconName[] = [
  'home',
  'star',
  'rocket',
  'heart',
  'leaf',
  'flame',
  'book',
  'music',
  'code',
  'people',
  'bulb',
  'target',
  'cube',
  'moon',
  'wallet',
  'build',
]

/** The three shown on the empty screen, in this order. */
export const DREAM_EXAMPLES: { icon: IconName; label: string; blurb: string; color: string }[] = [
  {
    icon: 'home',
    label: 'A place',
    blurb: 'The house, the studio, the view from the window.',
    color: 'var(--accent-cyan)',
  },
  {
    icon: 'rocket',
    label: 'A leap',
    blurb: 'The move, the business, the year off.',
    color: 'var(--accent-violet)',
  },
  {
    icon: 'star',
    label: 'A one-off',
    blurb: 'The trip you have described to people more than once.',
    color: 'var(--accent-amber)',
  },
]

/** Fallback tint when a dream has no image to lead with. */
export const DREAM_COLOR = 'var(--accent-violet)'
