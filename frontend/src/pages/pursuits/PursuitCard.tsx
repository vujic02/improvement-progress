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
import {
  STEP_BATCH_MAX,
  STEP_NAME_MAX,
  formatMoney,
  kindMeta,
  parseAmount,
  type Pursuit,
  type PursuitArea,
  type PursuitStep,
} from '../../data/pursuits'
import { daysBetween, mediumDate, parseDateInput } from '../../lib/date'
import type { NewStep, Result } from '../../pursuits/context'
import styles from './PursuitCard.module.css'

export interface PursuitCardProps {
  pursuit: Pursuit
  area: PursuitArea
  /** Opens the edit modal on this goal. */
  onEdit: () => void
  onRemove: () => Promise<Result>
  /** Money areas only. Adds to the balance; negatives correct a mistake. */
  onContribute?: (amount: number) => Promise<Result>
  /** A worded step, or — in a money area — `count` payments of `amount`. */
  onAddStep: (step: NewStep) => Promise<Result>
  onToggleStep: (stepId: string) => Promise<Result>
  onRemoveStep: (stepId: string) => Promise<Result>
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

/** What a step reads as: its words, or the payment it stands for. */
const stepText = (step: PursuitStep) =>
  step.amount !== undefined ? formatMoney(step.amount) : (step.label ?? '')

/**
 * How the planned payments sit against the target — a hint, never a block.
 * Null when there is nothing to compare.
 */
function planLine(planned: number, goal: number): string | null {
  if (goal <= 0 || planned <= 0) return null
  const diff = planned - goal
  if (diff > 0) return `${formatMoney(diff)} more planned than the target.`
  if (diff < 0) return `${formatMoney(-diff)} of the target not planned yet.`
  return 'The payments cover the target exactly.'
}

/** One pursuit — a saving, a lift, a language — with its steps underneath. */
export function PursuitCard({
  pursuit,
  area,
  onEdit,
  onRemove,
  onContribute,
  onAddStep,
  onToggleStep,
  onRemoveStep,
}: PursuitCardProps) {
  const [draft, setDraft] = useState('')
  // Money areas add payments: an amount, repeated `count` times.
  const [count, setCount] = useState('1')
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  // One write at a time per card: a second click while the first is in flight
  // would race it, and a double-sent step or contribution is a real duplicate.
  const [busy, setBusy] = useState(false)

  /** Runs one write, holding the card busy and surfacing its failure. */
  const run = async (action: () => Promise<Result>): Promise<boolean> => {
    if (busy) return false
    setBusy(true)
    setError(null)
    const result = await action()
    setBusy(false)
    if (!result.ok) setError(result.reason)
    return result.ok
  }

  const meta = kindMeta(area, pursuit.kind)
  const done = pursuit.steps.filter((s) => s.done).length
  const total = pursuit.steps.length

  // A money goal with a target measures itself in money; its payments are a
  // plan with their own count. Without a target, the steps drive the bar.
  const money = Boolean(area.money)
  const saved = pursuit.saved ?? 0
  const goal = pursuit.target ?? 0
  const byMoney = money && goal > 0
  const pct = byMoney ? (saved / goal) * 100 : total ? (done / total) * 100 : 0
  const complete = byMoney ? saved >= goal : total > 0 && done === total
  // Nothing to measure against yet — a bar pinned at 0 just looks broken. A
  // money goal with neither a target nor payments just shows its total.
  const showBar = byMoney || !money || total > 0
  const planned = pursuit.steps.reduce((sum, s) => sum + (s.amount ?? 0), 0)
  const plan = money ? planLine(planned, goal) : null
  // Money out stays its own colour when it is finished; only gains go green.
  const barColor = complete && !meta.spend ? 'var(--accent-green)' : meta.color
  const verb = meta.spend ? 'paid' : 'put aside'
  const { text: timeLeft, late } = countdown(pursuit.targetAt)
  const start = parseDateInput(pursuit.createdAt)
  const target = parseDateInput(pursuit.targetAt)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    let step: NewStep
    if (money) {
      const value = parseAmount(draft)
      const times = Number(count || '1')
      if (value === null || Number.isNaN(value)) {
        setError('Enter an amount.')
        return
      }
      step = { amount: value, count: times }
    } else {
      step = { label: draft }
    }
    if (await run(() => onAddStep(step))) {
      setDraft('')
      setCount('1')
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
        <div className={styles.headActions}>
          <IconButton
            icon="pencil"
            label={`Edit ${pursuit.name}`}
            size={18}
            disabled={busy}
            onClick={onEdit}
          />
          <IconButton
            icon="trash"
            label={`Remove ${pursuit.name}`}
            size={18}
            disabled={busy}
            onClick={() => void run(onRemove)}
          />
        </div>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressHead}>
          <Eyebrow>{complete ? 'Done' : 'Progress'}</Eyebrow>
          <span className={styles.progressCount}>
            {byMoney ? (
              <>
                {formatMoney(saved)}
                <span className={styles.progressOf}> of {formatMoney(goal)}</span>
              </>
            ) : money && total === 0 ? (
              <>
                {formatMoney(saved)}
                <span className={styles.progressOf}> {verb}</span>
              </>
            ) : (
              `${done}/${total} steps`
            )}
          </span>
        </div>
        {showBar ? (
          <ProgressBar value={pct} color={barColor} label={`${pursuit.name} progress`} />
        ) : null}
        {money && total > 0 ? (
          <span className={styles.plan}>
            {byMoney
              ? `${done} of ${total} payments made.`
              : `${formatMoney(saved)} ${verb} so far.`}
            {plan ? ` ${plan}` : null}
          </span>
        ) : null}
      </div>

      {money && onContribute ? (
        <form
          className={styles.contribute}
          onSubmit={async (event) => {
            event.preventDefault()
            const value = parseAmount(amount)
            if (value === null || Number.isNaN(value)) {
              setError('Enter an amount.')
              return
            }
            if (await run(() => onContribute(value))) setAmount('')
          }}
        >
          <span className={styles.currency} aria-hidden="true">
            €
          </span>
          <input
            className={styles.contributeInput}
            type="number"
            inputMode="decimal"
            step="0.01"
            value={amount}
            placeholder={meta.spend ? 'Log what you paid' : 'Put more aside'}
            aria-label={`Add an amount to ${pursuit.name}`}
            onChange={(e) => {
              setAmount(e.target.value)
              setError(null)
            }}
          />
          <IconButton
            icon="plus"
            label={`Add to ${pursuit.name}`}
            size={18}
            className={styles.contributeButton}
            type="submit"
            disabled={busy || !amount.trim()}
          />
        </form>
      ) : null}

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
                onToggle={() => void run(() => onToggleStep(step.id))}
                label={stepText(step)}
              />
              <span
                className={[styles.stepLabel, step.done ? styles.stepDone : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {stepText(step)}
              </span>
              <IconButton
                icon="close"
                label={`Remove ${stepText(step)}`}
                size={14}
                className={styles.stepRemove}
                disabled={busy}
                onClick={() => void run(() => onRemoveStep(step.id))}
              />
            </div>
          ))
        ) : (
          <span className={styles.noSteps}>{area.noSteps}</span>
        )}
      </div>

      <form className={styles.add} onSubmit={submit}>
        {money ? (
          <>
            <span className={styles.currency} aria-hidden="true">
              €
            </span>
            <input
              className={styles.addInput}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={draft}
              placeholder={area.stepPlaceholder}
              aria-label={`Payment amount for ${pursuit.name}`}
              onChange={(e) => {
                setDraft(e.target.value)
                setError(null)
              }}
            />
            <span className={styles.times} aria-hidden="true">
              ×
            </span>
            <input
              className={[styles.addInput, styles.countInput].join(' ')}
              type="number"
              inputMode="numeric"
              min={1}
              max={STEP_BATCH_MAX}
              step={1}
              value={count}
              aria-label="How many payments"
              onChange={(e) => {
                setCount(e.target.value)
                setError(null)
              }}
            />
          </>
        ) : (
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
        )}
        <IconButton
          icon="plus"
          label={money ? `Add payments to ${pursuit.name}` : `Add step to ${pursuit.name}`}
          size={18}
          className={styles.addButton}
          type="submit"
          disabled={busy || !draft.trim()}
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
