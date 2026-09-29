import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  MAX_AMOUNT,
  PURSUIT_NAME_MAX,
  STEP_NAME_MAX,
  formatMoney,
  safeImageUrl,
  type Pursuit,
  type PursuitStep,
} from '../data/pursuits'
import { del, failure, get, patch, post } from '../lib/api'
import { parseDateInput } from '../lib/date'
import { useSession } from '../session/context'
import type { NewPursuit, PursuitAreaId, PursuitContext, PursuitEdit, Result } from './context'

/**
 * The cheap checks `add` and `update` share, run before a request so a typo
 * gets an instant answer. Returns the trimmed name and the normalised image,
 * or why the form was refused. `self` is the goal being edited, which may keep
 * its own name.
 */
function checkForm(
  fields: PursuitEdit & { saved?: number },
  others: Pursuit[],
  self?: string,
): { ok: true; name: string; image: string | undefined } | { ok: false; reason: string } {
  const name = fields.name.trim()
  if (!name) return { ok: false, reason: 'Give it a name.' }
  if (name.length > PURSUIT_NAME_MAX) {
    return { ok: false, reason: `Keep the name to ${PURSUIT_NAME_MAX} characters.` }
  }
  if (others.some((p) => p.id !== self && p.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, reason: 'You already have one with that name.' }
  }

  const start = parseDateInput(fields.createdAt)
  const target = parseDateInput(fields.targetAt)
  if (!start) return { ok: false, reason: 'Pick a start date.' }
  if (!target) return { ok: false, reason: 'Pick a target date.' }
  if (target < start) return { ok: false, reason: 'The target date is before the start date.' }

  // Only https addresses are stored, and only ever rendered as an <img src>.
  const picture = fields.image?.trim() ? safeImageUrl(fields.image) : null
  if (fields.image?.trim() && !picture) {
    return { ok: false, reason: 'Use an https:// address for the image.' }
  }

  for (const amount of [fields.target, fields.saved]) {
    if (amount === undefined) continue
    if (!Number.isFinite(amount) || amount < 0) {
      return { ok: false, reason: 'Amounts have to be zero or more.' }
    }
    if (amount > MAX_AMOUNT) {
      return { ok: false, reason: `Keep amounts under ${formatMoney(MAX_AMOUNT)}.` }
    }
  }

  return { ok: true, name, image: picture ?? undefined }
}

export interface PursuitsProviderProps {
  /** Which list this provider holds — the server keeps the three apart by it. */
  area: PursuitAreaId
  /** The area's own context object — each area passes its own. */
  context: PursuitContext
  children: ReactNode
}

/**
 * One area's pursuits, loaded from and saved through `/api/pursuits?area=`.
 * Mounted once per area, each with its own context, so the lists never see
 * each other.
 *
 * <p>Writes wait for the server and apply what it returns, rather than
 * guessing: a contribution comes back with the clamped balance, a toggled step
 * with the state the server settled on.
 *
 * <p>The cheap checks run here first so a typo gets an instant answer; the
 * server repeats every one of them and has the final word.
 */
export function PursuitsProvider({ area, context, children }: PursuitsProviderProps) {
  const { user } = useSession()
  const userId = user?.id

  const [pursuits, setPursuits] = useState<Pursuit[]>([])
  // Signed out there is nothing to load, so loading starts false and stays there.
  const [loading, setLoading] = useState(userId !== undefined)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (userId === undefined) return
    // A response for a load that has since been replaced must not land.
    let current = true
    get<Pursuit[]>(`/api/pursuits?area=${area}`)
      .then((loaded) => {
        if (current) setPursuits(loaded)
      })
      .catch((e: unknown) => {
        if (current) setError(e instanceof Error ? e.message : 'Could not load your goals.')
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [userId, area, attempt])

  const reload = useCallback(() => {
    setError(null)
    setLoading(true)
    setAttempt((n) => n + 1)
  }, [])

  /** Swaps in the server's copy of one pursuit. */
  const replace = useCallback((updated: Pursuit) => {
    setPursuits((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }, [])

  /** Applies `edit` to the steps of one pursuit. */
  const editSteps = useCallback(
    (pursuitId: string, edit: (steps: PursuitStep[]) => PursuitStep[]) => {
      setPursuits((prev) =>
        prev.map((p) => (p.id === pursuitId ? { ...p, steps: edit(p.steps) } : p)),
      )
    },
    [],
  )

  const add = useCallback(
    async (fields: NewPursuit): Promise<Result> => {
      const checked = checkForm(fields, pursuits)
      if (!checked.ok) return checked

      try {
        const created = await post<Pursuit>(`/api/pursuits?area=${area}`, {
          name: checked.name,
          kind: fields.kind,
          icon: fields.icon,
          image: checked.image,
          target: fields.target,
          saved: fields.saved,
          createdAt: fields.createdAt,
          targetAt: fields.targetAt,
        })
        setPursuits((prev) => [created, ...prev])
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [area, pursuits],
  )

  const update = useCallback(
    async (id: string, fields: PursuitEdit): Promise<Result> => {
      const checked = checkForm(fields, pursuits, id)
      if (!checked.ok) return checked

      try {
        // The whole form goes, so a blank image or target clears it. Steps and
        // the balance come back untouched.
        replace(
          await patch<Pursuit>(`/api/pursuits/${id}`, {
            name: checked.name,
            kind: fields.kind,
            icon: fields.icon,
            image: checked.image,
            target: fields.target,
            createdAt: fields.createdAt,
            targetAt: fields.targetAt,
          }),
        )
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [pursuits, replace],
  )

  const remove = useCallback(async (id: string): Promise<Result> => {
    try {
      await del(`/api/pursuits/${id}`)
      setPursuits((prev) => prev.filter((p) => p.id !== id))
      return { ok: true }
    } catch (e) {
      return failure(e)
    }
  }, [])

  const addStep = useCallback(
    async (pursuitId: string, label: string): Promise<Result> => {
      const text = label.trim()
      if (!text) return { ok: false, reason: 'Describe the step first.' }
      if (text.length > STEP_NAME_MAX) {
        return { ok: false, reason: `Keep it to ${STEP_NAME_MAX} characters.` }
      }

      const pursuit = pursuits.find((p) => p.id === pursuitId)
      if (pursuit?.steps.some((s) => s.label.toLowerCase() === text.toLowerCase())) {
        return { ok: false, reason: 'That step is already on the list.' }
      }

      try {
        const step = await post<PursuitStep>(`/api/pursuits/${pursuitId}/steps`, { label: text })
        editSteps(pursuitId, (steps) => [...steps, step])
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [pursuits, editSteps],
  )

  const toggleStep = useCallback(
    async (pursuitId: string, stepId: string): Promise<Result> => {
      try {
        // No body: the server flips whatever it has, so two devices cannot
        // talk each other back into the state they started from.
        const step = await patch<PursuitStep>(`/api/pursuits/${pursuitId}/steps/${stepId}`)
        editSteps(pursuitId, (steps) => steps.map((s) => (s.id === stepId ? step : s)))
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [editSteps],
  )

  const removeStep = useCallback(
    async (pursuitId: string, stepId: string): Promise<Result> => {
      try {
        await del(`/api/pursuits/${pursuitId}/steps/${stepId}`)
        editSteps(pursuitId, (steps) => steps.filter((s) => s.id !== stepId))
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [editSteps],
  )

  const contribute = useCallback(
    async (pursuitId: string, amount: number): Promise<Result> => {
      if (!Number.isFinite(amount) || amount === 0) {
        return { ok: false, reason: 'Enter an amount.' }
      }
      if (Math.abs(amount) > MAX_AMOUNT) {
        return { ok: false, reason: `Keep amounts under ${formatMoney(MAX_AMOUNT)}.` }
      }

      try {
        // The server clamps at zero and returns the whole goal, so the balance
        // shown is always the one it stored.
        replace(await post<Pursuit>(`/api/pursuits/${pursuitId}/contributions`, { amount }))
        return { ok: true }
      } catch (e) {
        return failure(e)
      }
    },
    [replace],
  )

  const value = useMemo(
    () => ({
      pursuits,
      loading,
      error,
      reload,
      add,
      update,
      remove,
      addStep,
      toggleStep,
      removeStep,
      contribute,
    }),
    [
      pursuits,
      loading,
      error,
      reload,
      add,
      update,
      remove,
      addStep,
      toggleStep,
      removeStep,
      contribute,
    ],
  )

  return <context.Provider value={value}>{children}</context.Provider>
}
