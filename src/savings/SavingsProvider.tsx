import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { GOAL_NAME_MAX, STEP_NAME_MAX, type Goal } from '../data/savings'
import { parseDateInput } from '../lib/date'
import { SavingsContext, type NewGoal, type Result } from './context'

let seq = 0
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${seq++}`

/**
 * Holds the user's savings, investments and dreams for the session. Nothing is
 * persisted yet — swap the useState for a backend and every consumer keeps
 * working, they all read through `useSavings()`.
 */
export function SavingsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([])

  const addGoal = useCallback(
    ({ name, kind, createdAt, targetAt }: NewGoal): Result => {
      const label = name.trim()
      if (!label) return { ok: false, reason: 'Give it a name.' }
      if (label.length > GOAL_NAME_MAX) {
        return { ok: false, reason: `Keep the name to ${GOAL_NAME_MAX} characters.` }
      }
      if (goals.some((g) => g.name.toLowerCase() === label.toLowerCase())) {
        return { ok: false, reason: 'You already have one with that name.' }
      }

      const start = parseDateInput(createdAt)
      const target = parseDateInput(targetAt)
      if (!start) return { ok: false, reason: 'Pick a start date.' }
      if (!target) return { ok: false, reason: 'Pick a target date.' }
      if (target < start) return { ok: false, reason: 'The target date is before the start date.' }

      setGoals((prev) => [
        { id: nextId('goal'), name: label, kind, createdAt, targetAt, steps: [] },
        ...prev,
      ])
      return { ok: true }
    },
    [goals],
  )

  const removeGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const addStep = useCallback(
    (goalId: string, label: string): Result => {
      const text = label.trim()
      if (!text) return { ok: false, reason: 'Describe the step first.' }
      if (text.length > STEP_NAME_MAX) {
        return { ok: false, reason: `Keep it to ${STEP_NAME_MAX} characters.` }
      }

      const goal = goals.find((g) => g.id === goalId)
      if (goal?.steps.some((s) => s.label.toLowerCase() === text.toLowerCase())) {
        return { ok: false, reason: 'That step is already on the list.' }
      }

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? { ...g, steps: [...g.steps, { id: nextId('step'), label: text, done: false }] }
            : g,
        ),
      )
      return { ok: true }
    },
    [goals],
  )

  const toggleStep = useCallback((goalId: string, stepId: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              steps: g.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)),
            }
          : g,
      ),
    )
  }, [])

  const removeStep = useCallback((goalId: string, stepId: string) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId ? { ...g, steps: g.steps.filter((s) => s.id !== stepId) } : g,
      ),
    )
  }, [])

  const value = useMemo(
    () => ({ goals, addGoal, removeGoal, addStep, toggleStep, removeStep }),
    [goals, addGoal, removeGoal, addStep, toggleStep, removeStep],
  )

  return <SavingsContext.Provider value={value}>{children}</SavingsContext.Provider>
}
