import type { IconName } from '../components/Icon'

export interface TaskType {
  id: string
  label: string
  color: string
  icon: IconName
  /** Defaults ship with the app and cannot be removed. */
  custom?: boolean
}

/** Names are capped at this length in the create form. */
export const TASK_TYPE_NAME_MAX = 30

/** How many types a user may add on top of the ten defaults. */
export const CUSTOM_TASK_TYPE_LIMIT = 10

export const DEFAULT_TASK_TYPES: TaskType[] = [
  { id: 'deep', label: 'Deep work', color: '#0075FF', icon: 'build' },
  { id: 'gym', label: 'Gym / movement', color: '#01B574', icon: 'rocket' },
  { id: 'learn', label: 'Learning', color: '#582CFF', icon: 'documentText' },
  { id: 'money', label: 'Money / admin', color: '#F79E1B', icon: 'wallet' },
  { id: 'chores', label: 'Chores / errands', color: '#2CD9FF', icon: 'cube' },
  { id: 'mind', label: 'Mindset check-in', color: '#4FD1C5', icon: 'tagFaces' },
  { id: 'food', label: 'Nutrition', color: '#A3E635', icon: 'leaf' },
  { id: 'sleep', label: 'Sleep / recovery', color: '#9F7AEA', icon: 'moon' },
  { id: 'social', label: 'Social / family', color: '#E5399E', icon: 'people' },
  { id: 'create', label: 'Creative / side project', color: '#FFB547', icon: 'bulb' },
  { id: 'health', label: 'Health / medical', color: '#FF5B79', icon: 'heart' },
  { id: 'plan', label: 'Planning / review', color: '#7B61FF', icon: 'target' },
]

/**
 * Custom types have no colour picker yet, so each new one takes the next
 * colour in this list and wraps around once the list runs out.
 */
export const CUSTOM_COLORS = [
  '#0075FF',
  '#01B574',
  '#582CFF',
  '#F79E1B',
  '#2CD9FF',
  '#4FD1C5',
  '#A3E635',
  '#9F7AEA',
  '#E5399E',
  '#FFB547',
]

/** The icons offered in the create form. */
export const PICKABLE_ICONS: IconName[] = [
  'build',
  'rocket',
  'documentText',
  'wallet',
  'cube',
  'tagFaces',
  'leaf',
  'moon',
  'people',
  'bulb',
  'heart',
  'flame',
  'book',
  'music',
  'code',
  'star',
  'target',
  'statsChart',
  'clock',
  'home',
]

export const WEEK_TINTS = ['#582CFF', '#0075FF', '#4FD1C5', '#E5399E', '#01B574']

/** Looks up a default type. Today's mock tasks only reference these. */
export function taskTypeById(id: string): TaskType {
  return DEFAULT_TASK_TYPES.find((t) => t.id === id) ?? DEFAULT_TASK_TYPES[0]
}
