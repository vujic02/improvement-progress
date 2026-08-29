import { useState, type FormEvent } from 'react'
import {
  CheckSquare,
  Eyebrow,
  GlassCard,
  Icon,
  IconButton,
  IconTile,
  ProgressBar,
} from '../../components'
import { GOAL_KIND_META, STEP_NAME_MAX, type Goal } from '../../data/savings'
import { daysBetween, mediumDate, parseDateInput } from '../../lib/date'
import type { Result } from '../../savings/context'
import styles from './GoalCard.module.css'

export interface GoalCardProps {
  goal: Goal
  onRemove: () => void
  onAddStep: (label: string) => Result
  onToggleStep: (stepId: string) => void
  onRemoveStep: (stepId: string) => void
}

/** How much time is left, in the words the card actually shows. */
function countdown(targetAt: string): { text: string; late: boolean } {
  const target = parseDateInput(targetAt)
  if (!target) return { text: 'No target date', late: false }
  const left = daysBetween(new Date(), target)
  if (left > 0) return { text: `${left} day${left === 1 ? '' : 's'} left`, late: false }
  if (left === 0) return { text: 'Due today', late: false }
  return { text: `${-left} day${left === -1 ? '' : 's'} overdue`, late: true }
}

/** One saving, investment or dream, with its steps underneath. */
export function GoalCard({ goal, onRemove, onAddStep, onToggleStep, onRemoveStep }: GoalCardProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const meta = GOAL_KIND_META[goal.kind]
  const done = goal.steps.filter((s) => s.done).length
  const total = goal.steps.length
  const pct = total ? (done / total) * 100 : 0
  const complete = total > 0 && done === total
  const { text: timeLeft, late } = countdown(goal.targetAt)
  const start = parseDateInput(goal.createdAt)
  const target = parseDateInput(goal.targetAt)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = onAddStep(draft)
    if (result.ok) {
      setDraft('')
      setError(null)
    } else {
      setError(result.reason)
    }
  }

  return (
    <GlassCard padding="22px 22px 20px" className={styles.card}>
      <div className={styles.head}>
        <IconTile icon={meta.icon} size={44} radius={12} tone="raised" color={meta.color} />
        <div className={styles.titles}>
          <span className={styles.name}>{goal.name}</span>
          <span className={styles.kind}>
            <span className={styles.swatch} style={{ background: meta.color }} />
            {meta.label}
          </span>
        </div>
        <IconButton
          icon="trash"
          label={`Remove ${goal.name}`}
          size={18}
          className={styles.remove}
          onClick={onRemove}
        />
      </div>

      <div className={styles.progress}>
        <div className={styles.progressHead}>
          <Eyebrow>{complete ? 'Done' : 'Progress'}</Eyebrow>
          <span className={styles.progressCount}>
            {done}/{total} steps
          </span>
        </div>
        <ProgressBar
          value={pct}
          color={complete ? 'var(--accent-green)' : meta.color}
          label={`${goal.name} progress`}
        />
      </div>

      <div className={styles.dates}>
        <span className={styles.date}>
          <Icon name="clock" size={14} />
          {start ? mediumDate(start) : goal.createdAt}
          <span className={styles.arrow}>→</span>
          {target ? mediumDate(target) : goal.targetAt}
        </span>
        <span className={[styles.left, late ? styles.late : ''].filter(Boolean).join(' ')}>
          {timeLeft}
        </span>
      </div>

      <div className={styles.steps}>
        {goal.steps.length ? (
          goal.steps.map((step) => (
            <div key={step.id} className={styles.step}>
              <CheckSquare
                checked={step.done}
                color={meta.color}
                size={18}
                onToggle={() => onToggleStep(step.id)}
                label={step.label}
              />
              <span
                className={[styles.stepLabel, step.done ? styles.stepDone : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {step.label}
              </span>
              <IconButton
                icon="close"
                label={`Remove ${step.label}`}
                size={14}
                className={styles.stepRemove}
                onClick={() => onRemoveStep(step.id)}
              />
            </div>
          ))
        ) : (
          <span className={styles.noSteps}>
            No steps yet. Break it into the things you actually have to do.
          </span>
        )}
      </div>

      <form className={styles.add} onSubmit={submit}>
        <input
          className={styles.addInput}
          value={draft}
          maxLength={STEP_NAME_MAX}
          placeholder="Add a step…"
          aria-label={`Add a step to ${goal.name}`}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
        />
        <IconButton
          icon="plus"
          label={`Add step to ${goal.name}`}
          size={18}
          className={styles.addButton}
          type="submit"
          disabled={!draft.trim()}
        />
      </form>

      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </GlassCard>
  )
}
