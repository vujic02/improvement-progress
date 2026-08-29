import { useState, type FormEvent } from 'react'
import {
  CheckSquare,
  Eyebrow,
  GlassCard,
  Icon,
  IconButton,
  ProgressBar,
} from '../../components'
import { DREAM_COLOR } from '../../data/dreams'
import { STEP_NAME_MAX, type Pursuit } from '../../data/pursuits'
import { daysBetween, mediumDate, parseDateInput } from '../../lib/date'
import type { Result } from '../../pursuits/context'
import styles from './DreamCard.module.css'

export interface DreamCardProps {
  dream: Pursuit
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

/**
 * One dream. Photo-led when it has an image, icon-led when it does not — and
 * it falls back to the icon if the image fails to load, so a dead link degrades
 * instead of leaving a hole in the grid.
 */
export function DreamCard({
  dream,
  onRemove,
  onAddStep,
  onToggleStep,
  onRemoveStep,
}: DreamCardProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [brokenImage, setBrokenImage] = useState(false)

  const done = dream.steps.filter((s) => s.done).length
  const total = dream.steps.length
  const pct = total ? (done / total) * 100 : 0
  const complete = total > 0 && done === total
  const { text: timeLeft, late } = countdown(dream.targetAt)
  const start = parseDateInput(dream.createdAt)
  const target = parseDateInput(dream.targetAt)
  const icon = dream.icon ?? 'star'
  const showImage = Boolean(dream.image) && !brokenImage

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
    <GlassCard padding={0} className={styles.card}>
      <div className={styles.banner}>
        {showImage ? (
          /*
           * The address is validated as https by the store. It is rendered here
           * and nowhere else — never as an href, a style, or a CSS url().
           */
          <img
            className={styles.image}
            src={dream.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setBrokenImage(true)}
          />
        ) : (
          <span className={styles.bannerFallback} aria-hidden="true">
            <Icon name={icon} size={44} />
          </span>
        )}

        <span className={styles.scrim} />

        <span className={styles.badge} aria-hidden="true">
          <Icon name={icon} size={18} />
        </span>

        <IconButton
          icon="trash"
          label={`Remove ${dream.name}`}
          size={18}
          className={styles.remove}
          onClick={onRemove}
        />

        <span className={styles.name}>{dream.name}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.progress}>
          <div className={styles.progressHead}>
            <Eyebrow>{complete ? 'Done' : 'Progress'}</Eyebrow>
            <span className={styles.progressCount}>
              {done}/{total} steps
            </span>
          </div>
          <ProgressBar
            value={pct}
            color={complete ? 'var(--accent-green)' : DREAM_COLOR}
            label={`${dream.name} progress`}
          />
        </div>

        <div className={styles.dates}>
          <span className={styles.date}>
            <Icon name="clock" size={14} />
            {start ? mediumDate(start) : dream.createdAt}
            <span className={styles.arrow}>→</span>
            {target ? mediumDate(target) : dream.targetAt}
          </span>
          <span className={[styles.left, late ? styles.late : ''].filter(Boolean).join(' ')}>
            {timeLeft}
          </span>
        </div>

        <div className={styles.steps}>
          {dream.steps.length ? (
            dream.steps.map((step) => (
              <div key={step.id} className={styles.step}>
                <CheckSquare
                  checked={step.done}
                  color={DREAM_COLOR}
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
              No steps yet. Even a dream house starts with a number and a date.
            </span>
          )}
        </div>

        <form className={styles.add} onSubmit={submit}>
          <input
            className={styles.addInput}
            value={draft}
            maxLength={STEP_NAME_MAX}
            placeholder="Add a step…"
            aria-label={`Add a step to ${dream.name}`}
            onChange={(e) => {
              setDraft(e.target.value)
              setError(null)
            }}
          />
          <IconButton
            icon="plus"
            label={`Add step to ${dream.name}`}
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
      </div>
    </GlassCard>
  )
}
