import { useState, type FormEvent } from 'react'
import { Button, Icon, Input, Modal } from '../../components'
import {
  DEFAULT_TARGET_MONTHS,
  GOAL_KIND_META,
  GOAL_KINDS,
  GOAL_NAME_MAX,
  type GoalKind,
} from '../../data/savings'
import { daysBetween, mediumDate, parseDateInput, toDateInput } from '../../lib/date'
import type { NewGoal, Result } from '../../savings/context'
import styles from './GoalModal.module.css'

export interface GoalModalProps {
  open: boolean
  onClose: () => void
  onCreate: (goal: NewGoal) => Result
}

function defaultTarget(from: Date): string {
  const d = new Date(from)
  d.setMonth(d.getMonth() + DEFAULT_TARGET_MONTHS)
  return toDateInput(d)
}

/**
 * The fields. Mounted only while the dialog is open, so every open starts
 * blank and re-reads today's date — no reset effect needed.
 */
function GoalForm({ onClose, onCreate }: Omit<GoalModalProps, 'open'>) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<GoalKind>('saving')
  const [createdAt, setCreatedAt] = useState(() => toDateInput(new Date()))
  const [targetAt, setTargetAt] = useState(() => defaultTarget(new Date()))
  const [error, setError] = useState<string | null>(null)

  const start = parseDateInput(createdAt)
  const target = parseDateInput(targetAt)
  const span = start && target ? daysBetween(start, target) : null

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = onCreate({ name, kind, createdAt, targetAt })
    if (result.ok) onClose()
    else setError(result.reason)
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Input
        label="Name"
        value={name}
        maxLength={GOAL_NAME_MAX}
        placeholder="e.g. Emergency fund"
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
        trailing={`${name.length}/${GOAL_NAME_MAX}`}
      />

      <fieldset className={styles.kinds}>
        <legend className={styles.legend}>Type</legend>
        <div className={styles.kindGrid} role="radiogroup" aria-label="Type">
          {GOAL_KINDS.map((option) => {
            const meta = GOAL_KIND_META[option]
            const selected = option === kind
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                className={[styles.kind, selected ? styles.kindSelected : '']
                  .filter(Boolean)
                  .join(' ')}
                style={selected ? { color: meta.color } : undefined}
                onClick={() => {
                  setKind(option)
                  setError(null)
                }}
              >
                <Icon name={meta.icon} size={20} />
                <span className={styles.kindLabel}>{meta.label}</span>
                <span className={styles.kindBlurb}>{meta.blurb}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className={styles.dates}>
        <Input
          label="Started"
          type="date"
          value={createdAt}
          max={targetAt || undefined}
          onChange={(e) => {
            setCreatedAt(e.target.value)
            setError(null)
          }}
          trailing="Today by default"
        />
        <Input
          label="Target"
          type="date"
          value={targetAt}
          min={createdAt || undefined}
          onChange={(e) => {
            setTargetAt(e.target.value)
            setError(null)
          }}
          trailing="When you want it done"
        />
      </div>

      {span !== null && target ? (
        <span className={styles.span}>
          {span > 0
            ? `${span} day${span === 1 ? '' : 's'} to run — finishing ${mediumDate(target)}.`
            : span === 0
              ? 'Starts and finishes the same day.'
              : 'The target date is before the start date.'}
        </span>
      ) : null}

      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" size="md">
          Create goal
        </Button>
        <Button type="button" variant="subtle" size="md" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/** Create a saving, an investment or a dream. Name first, on purpose. */
export function GoalModal({ open, onClose, onCreate }: GoalModalProps) {
  return (
    <Modal
      open={open}
      title="New goal"
      subtitle="Name it, say what it is, and give it a finish line. Steps come after."
      onClose={onClose}
    >
      <GoalForm onClose={onClose} onCreate={onCreate} />
    </Modal>
  )
}
