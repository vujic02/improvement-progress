import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { PURSUIT_NAME_MAX, STEP_NAME_MAX, type Pursuit } from '../data/pursuits'
import { parseDateInput } from '../lib/date'
import type { NewPursuit, PursuitContext, Result } from './context'

let seq = 0
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${seq++}`

export interface PursuitsProviderProps {
  /** The area's own context object — savings and growth each pass their own. */
  context: PursuitContext
  children: ReactNode
}

/**
 * Holds one area's pursuits for the session. Nothing is persisted yet — swap
 * the useState for a backend and every consumer keeps working, they all read
 * through their area's hook.
 */
export function PursuitsProvider({ context, children }: PursuitsProviderProps) {
  const [pursuits, setPursuits] = useState<Pursuit[]>([])

  const add = useCallback(
    ({ name, kind, createdAt, targetAt }: NewPursuit): Result => {
      const label = name.trim()
      if (!label) return { ok: false, reason: 'Give it a name.' }
      if (label.length > PURSUIT_NAME_MAX) {
        return { ok: false, reason: `Keep the name to ${PURSUIT_NAME_MAX} characters.` }
      }
      if (pursuits.some((p) => p.name.toLowerCase() === label.toLowerCase())) {
        return { ok: false, reason: 'You already have one with that name.' }
      }

      const start = parseDateInput(createdAt)
      const target = parseDateInput(targetAt)
      if (!start) return { ok: false, reason: 'Pick a start date.' }
      if (!target) return { ok: false, reason: 'Pick a target date.' }
      if (target < start) return { ok: false, reason: 'The target date is before the start date.' }

      setPursuits((prev) => [
        { id: nextId('pursuit'), name: label, kind, createdAt, targetAt, steps: [] },
        ...prev,
      ])
      return { ok: true }
    },
    [pursuits],
  )

  const remove = useCallback((id: string) => {
    setPursuits((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addStep = useCallback(
    (pursuitId: string, label: string): Result => {
      const text = label.trim()
      if (!text) return { ok: false, reason: 'Describe the step first.' }
      if (text.length > STEP_NAME_MAX) {
        return { ok: false, reason: `Keep it to ${STEP_NAME_MAX} characters.` }
      }

      const pursuit = pursuits.find((p) => p.id === pursuitId)
      if (pursuit?.steps.some((s) => s.label.toLowerCase() === text.toLowerCase())) {
        return { ok: false, reason: 'That step is already on the list.' }
      }

      setPursuits((prev) =>
        prev.map((p) =>
          p.id === pursuitId
            ? { ...p, steps: [...p.steps, { id: nextId('step'), label: text, done: false }] }
            : p,
        ),
      )
      return { ok: true }
    },
    [pursuits],
  )

  const toggleStep = useCallback((pursuitId: string, stepId: string) => {
    setPursuits((prev) =>
      prev.map((p) =>
        p.id === pursuitId
          ? { ...p, steps: p.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)) }
          : p,
      ),
    )
  }, [])

  const removeStep = useCallback((pursuitId: string, stepId: string) => {
    setPursuits((prev) =>
      prev.map((p) =>
        p.id === pursuitId ? { ...p, steps: p.steps.filter((s) => s.id !== stepId) } : p,
      ),
    )
  }, [])

  const value = useMemo(
    () => ({ pursuits, add, remove, addStep, toggleStep, removeStep }),
    [pursuits, add, remove, addStep, toggleStep, removeStep],
  )

  return <context.Provider value={value}>{children}</context.Provider>
}
