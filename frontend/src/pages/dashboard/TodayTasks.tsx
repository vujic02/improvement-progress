import { useState, type FormEvent } from 'react'
import { Button, GlassCard, Input, SectionHeading, TaskRow } from '../../components'
import { useDays } from '../../days/context'
import { TASK_TYPE_NAME_MAX } from '../../data/taskTypes'
import type { Result } from '../../session/context'
import { useTaskTypes } from '../../taskTypes/context'
import styles from './views.module.css'

/** Long enough for a real task, and what the API stores. */
const LABEL_MAX = 80

export interface TodayTasksProps {
  /** The line under the heading — the same tally the page head shows. */
  subtitle: string
  /** The narrow week column: tighter rows and no type name. */
  compact?: boolean
}

/**
 * Today's list, shared by the month and week views. It owns the add form and
 * the per-row writes; the store behind it is the day tracker's API.
 */
export function TodayTasks({ subtitle, compact }: TodayTasksProps) {
  const { all: types } = useTaskTypes()
  const { today, loading, error, reload, add, toggle, remove } = useDays()

  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [typeId, setTypeId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // The task whose write is in flight, so a second click cannot send another.
  const [busy, setBusy] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)

  const chosen = typeId || types[0]?.id || ''
  const typeOf = (id: string) => types.find((type) => type.id === id)

  const reset = () => {
    setAdding(false)
    setLabel('')
    setFormError(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    const result = await add(chosen, label)
    setSaving(false)
    if (result.ok) reset()
    else setFormError(result.reason)
  }

  const run = async (id: string, action: (id: string) => Promise<Result>) => {
    if (busy) return
    setBusy(id)
    setRowError(null)
    const result = await action(id)
    setBusy(null)
    if (!result.ok) setRowError(result.reason)
  }

  return (
    <GlassCard>
      <SectionHeading
        title="Today's tasks"
        subtitle={subtitle}
        action={
          !adding ? (
            <Button
              variant="ghost"
              size="sm"
              style={{ minWidth: compact ? 100 : 118 }}
              disabled={loading || error !== null}
              onClick={() => setAdding(true)}
            >
              Add task
            </Button>
          ) : null
        }
      />

      {adding ? (
        <form className={styles.addForm} onSubmit={submit}>
          <Input
            label="Task"
            value={label}
            maxLength={LABEL_MAX}
            placeholder="e.g. Read 20 pages"
            autoFocus
            onChange={(e) => {
              setLabel(e.target.value)
              setFormError(null)
            }}
          />
          <label className={styles.addType}>
            <span className={styles.addTypeLabel}>Type</span>
            <select
              className={styles.select}
              value={chosen}
              aria-label="Task type"
              onChange={(e) => setTypeId(e.target.value)}
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label.slice(0, TASK_TYPE_NAME_MAX)}
                </option>
              ))}
            </select>
          </label>

          {formError ? (
            <span className={styles.stateError} role="alert">
              {formError}
            </span>
          ) : null}

          <div className={styles.addActions}>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Adding…' : 'Add'}
            </Button>
            <Button type="button" variant="subtle" size="sm" onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {rowError ? (
        <span className={styles.stateError} role="alert">
          {rowError}
        </span>
      ) : null}

      {/* A day still loading, or one that failed to load, is not an empty day. */}
      {loading ? (
        <span className={styles.stateLine}>Loading today…</span>
      ) : error ? (
        <div className={styles.stateBlock}>
          <span className={styles.stateError} role="alert">
            Couldn't load today. {error}
          </span>
          <Button size="sm" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : today.length ? (
        <div className={compact ? styles.compactList : styles.taskList}>
          {today.map((task) => {
            const type = typeOf(task.typeId)
            return (
              <TaskRow
                key={task.id}
                label={task.label}
                type={compact ? undefined : type?.label}
                color={type?.color ?? 'var(--text-muted)'}
                done={task.done}
                compact={compact}
                onToggle={() => run(task.id, toggle)}
                onRemove={() => run(task.id, remove)}
              />
            )
          })}
        </div>
      ) : (
        <span className={styles.stateLine}>
          Nothing logged yet. Add the first thing you did today.
        </span>
      )}
    </GlassCard>
  )
}
