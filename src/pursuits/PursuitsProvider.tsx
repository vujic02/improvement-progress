import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  MAX_AMOUNT,
  PURSUIT_NAME_MAX,
  STEP_NAME_MAX,
  formatMoney,
  safeImageUrl,
  type Pursuit,
} from '../data/pursuits'
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
    ({
      name,
      kind,
      icon,
      image,
      target: targetAmount,
      saved: savedAmount,
      createdAt,
      targetAt,
    }: NewPursuit): Result => {
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

      // Only https addresses are stored, and only ever rendered as an <img src>.
      const picture = image?.trim() ? safeImageUrl(image) : null
      if (image?.trim() && !picture) {
        return { ok: false, reason: 'Use an https:// address for the image.' }
      }

      for (const amount of [targetAmount, savedAmount]) {
        if (amount === undefined) continue
        if (!Number.isFinite(amount) || amount < 0) {
          return { ok: false, reason: 'Amounts have to be zero or more.' }
        }
        if (amount > MAX_AMOUNT) {
          return { ok: false, reason: `Keep amounts under ${formatMoney(MAX_AMOUNT)}.` }
        }
      }

      setPursuits((prev) => [
        {
          id: nextId('pursuit'),
          name: label,
          kind,
          icon,
          image: picture ?? undefined,
          target: targetAmount,
          saved: savedAmount,
          createdAt,
          targetAt,
          steps: [],
        },
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

  const contribute = useCallback((pursuitId: string, amount: number): Result => {
    if (!Number.isFinite(amount) || amount === 0) {
      return { ok: false, reason: 'Enter an amount.' }
    }
    if (Math.abs(amount) > MAX_AMOUNT) {
      return { ok: false, reason: `Keep amounts under ${formatMoney(MAX_AMOUNT)}.` }
    }

    setPursuits((prev) =>
      prev.map((p) =>
        p.id === pursuitId ? { ...p, saved: Math.max(0, (p.saved ?? 0) + amount) } : p,
      ),
    )
    return { ok: true }
  }, [])

  const value = useMemo(
    () => ({ pursuits, add, remove, addStep, toggleStep, removeStep, contribute }),
    [pursuits, add, remove, addStep, toggleStep, removeStep, contribute],
  )

  return <context.Provider value={value}>{children}</context.Provider>
}
