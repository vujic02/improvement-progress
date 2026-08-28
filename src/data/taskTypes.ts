import type { IconName } from '../components/Icon'

export interface TaskType {
  id: string
  label: string
  color: string
  icon: IconName
}

export const TASK_TYPES: TaskType[] = [
  { id: 'deep', label: 'Deep work', color: '#0075FF', icon: 'build' },
  { id: 'gym', label: 'Gym / movement', color: '#01B574', icon: 'rocket' },
  { id: 'learn', label: 'Learning', color: '#582CFF', icon: 'documentText' },
  { id: 'money', label: 'Money / admin', color: '#F79E1B', icon: 'wallet' },
  { id: 'chores', label: 'Chores / errands', color: '#2CD9FF', icon: 'cube' },
  { id: 'mind', label: 'Mindset check-in', color: '#4FD1C5', icon: 'tagFaces' },
]

export const WEEK_TINTS = ['#582CFF', '#0075FF', '#4FD1C5', '#E5399E', '#01B574']

export function taskTypeById(id: string): TaskType {
  return TASK_TYPES.find((t) => t.id === id) ?? TASK_TYPES[0]
}
