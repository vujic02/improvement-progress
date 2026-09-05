export interface DayTask {
  id: string
  type: string
  label: string
  done: boolean
}

/** Today's task list. Swap for a real fetch when the backend lands. */
export const TODAY_TASKS: DayTask[] = [
  { id: 't1', type: 'deep', label: 'Ship the tracker layout', done: true },
  { id: 't2', type: 'gym', label: 'Push session — 45 min', done: true },
  { id: 't3', type: 'learn', label: 'Read 20 pages', done: false },
  { id: 't4', type: 'money', label: 'Move 15% into index fund', done: false },
  { id: 't5', type: 'chores', label: 'Groceries + laundry', done: false },
  { id: 't6', type: 'mind', label: 'Evening check-in', done: false },
]

/**
 * Sample task labels, one row per entry of DEFAULT_TASK_TYPES and in the same
 * order. Keep the two in step - useWeekData indexes this array to pick a type.
 */
export const WEEK_TASK_POOL: string[][] = [
  ['Ship the tracker layout', 'Review active projects', 'Inbox to zero', 'Plan tomorrow\u2019s top 3'],
  ['Push session — 45 min', 'Mobility + stretch', 'Zone-2 walk'],
  ['Read 20 pages', 'Course module 4', 'Write notes'],
  ['Move 15% into index fund', 'Log weekly spend', 'Check portfolio drift'],
  ['Groceries + laundry', 'Fix the shelf', 'Car service call'],
  ['Evening check-in', 'Cold shower', 'No socials before noon'],
  ['Hit the protein target', 'Prep tomorrow’s lunch', 'Two litres of water'],
  ['Lights out by 23:00', 'No screens after 22:00', 'Morning sunlight walk'],
  ['Call home', 'Dinner with friends', 'Reply to the group chat'],
  ['Sketch the next feature', 'Record a demo clip', 'Ship a small side build'],
  ['Book the check-up', 'Refill the prescription', 'Ten minutes of breathing'],
  ['Weekly review', 'Set next week’s top 3', 'Tidy the task backlog'],
]
