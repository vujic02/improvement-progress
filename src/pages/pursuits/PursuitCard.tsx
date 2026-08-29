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
import { STEP_NAME_MAX, kindMeta, type Pursuit, type PursuitArea } from '../../data/pursuits'
import { daysBetween, mediumDate, parseDateInput } from '../../lib/date'
import type { Result } from '../../pursuits/context'
import styles from './PursuitCard.module.css'

export interface PursuitCardProps {
  pursuit: Pursuit
  area: PursuitArea
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

/** One pursuit — a saving, a lift, a language — with its steps underneath. */
export function PursuitCard({
  pursuit,
  area,
  onRemove,
  onAddStep,
  onToggleStep,
  onRemoveStep,
}: PursuitCardProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const meta = kindMeta(area, pursuit.kind)
  const done = pursuit.steps.filter((s) => s.done).length
  const total = pursuit.steps.length
  const pct = total ? (done / total) * 100 : 0
  const complete = total > 0 && done === total
  const { text: timeLeft, late } = countdown(pursuit.targetAt)
  const start = parseDateInput(pursuit.createdAt)
  const target = parseDateInput(pursuit.targetAt)

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
          <span className={styles.name}>{pursuit.name}</span>
          <span className={styles.kind}>
            <span className={styles.swatch} style={{ background: meta.color }} />
            {meta.label}
          </span>
        </div>
        <IconButton
          icon="trash"
          label={`Remove ${pursuit.name}`}
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
          label={`${pursuit.name} progress`}
        />
      </div>

      <div className={styles.dates}>
        <span className={styles.date}>
          <Icon name="clock" size={14} />
          {start ? mediumDate(start) : pursuit.createdAt}
          <span className={styles.arrow}>→</span>
          {target ? mediumDate(target) : pursuit.targetAt}
        </span>
        <span className={[styles.left, late ? styles.late : ''].filter(Boolean).join(' ')}>
          {timeLeft}
        </span>
      </div>

      <div className={styles.steps}>
        {pursuit.steps.length ? (
          pursuit.steps.map((step) => (
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
          <span className={styles.noSteps}>{area.noSteps}</span>
        )}
      </div>

      <form className={styles.add} onSubmit={submit}>
        <input
          className={styles.addInput}
          value={draft}
          maxLength={STEP_NAME_MAX}
          placeholder={area.stepPlaceholder}
          aria-label={`Add a step to ${pursuit.name}`}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
        />
        <IconButton
          icon="plus"
          label={`Add step to ${pursuit.name}`}
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
