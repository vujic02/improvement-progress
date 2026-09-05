import { useState, type FormEvent } from 'react'
import { Button, Icon, Input, Modal } from '../../components'
import {
  DEFAULT_TARGET_MONTHS,
  PURSUIT_NAME_MAX,
  formatMoney,
  kindMeta,
  parseAmount,
  type PursuitArea,
} from '../../data/pursuits'
import { daysBetween, mediumDate, parseDateInput, toDateInput } from '../../lib/date'
import type { NewPursuit, Result } from '../../pursuits/context'
import styles from './PursuitModal.module.css'

export interface PursuitModalProps {
  open: boolean
  area: PursuitArea
  onClose: () => void
  onCreate: (pursuit: NewPursuit) => Result
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
function PursuitForm({ area, onClose, onCreate }: Omit<PursuitModalProps, 'open'>) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<string>(area.kinds[0])
  const [targetInput, setTargetInput] = useState('')
  const [savedInput, setSavedInput] = useState('')
  const [createdAt, setCreatedAt] = useState(() => toDateInput(new Date()))
  const [targetAt, setTargetAt] = useState(() => defaultTarget(new Date()))
  const [error, setError] = useState<string | null>(null)

  const start = parseDateInput(createdAt)
  const target = parseDateInput(targetAt)
  const span = start && target ? daysBetween(start, target) : null

  const targetAmount = parseAmount(targetInput)
  const savedAmount = parseAmount(savedInput)
  const left =
    area.money && targetAmount && Number.isFinite(targetAmount)
      ? targetAmount - (Number.isFinite(savedAmount ?? 0) ? (savedAmount ?? 0) : 0)
      : null

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (area.money && (Number.isNaN(targetAmount) || Number.isNaN(savedAmount))) {
      setError('Amounts have to be numbers.')
      return
    }
    const result = onCreate({
      name,
      kind,
      createdAt,
      targetAt,
      ...(area.money ? { target: targetAmount ?? undefined, saved: savedAmount ?? undefined } : null),
    })
    if (result.ok) onClose()
    else setError(result.reason)
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Input
        label="Name"
        value={name}
        maxLength={PURSUIT_NAME_MAX}
        placeholder={area.namePlaceholder}
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
        trailing={`${name.length}/${PURSUIT_NAME_MAX}`}
      />

      <fieldset className={styles.kinds}>
        <legend className={styles.legend}>Type</legend>
        <div className={styles.kindGrid} role="radiogroup" aria-label="Type">
          {area.kinds.map((option) => {
            const meta = kindMeta(area, option)
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

      {area.money ? (
        <div className={styles.amounts}>
          <Input
            label="Target amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={targetInput}
            placeholder="0"
            onChange={(e) => {
              setTargetInput(e.target.value)
              setError(null)
            }}
            trailing="€ · optional"
          />
          <Input
            label="Already put aside"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={savedInput}
            placeholder="0"
            onChange={(e) => {
              setSavedInput(e.target.value)
              setError(null)
            }}
            trailing="€ · optional"
          />
        </div>
      ) : null}

      {left !== null && Number.isFinite(left) ? (
        <span className={styles.span}>
          {left > 0
            ? `${formatMoney(left)} to go.`
            : left === 0
              ? 'Already there — the target is covered.'
              : `${formatMoney(-left)} past the target.`}
        </span>
      ) : null}

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

/** Create a pursuit. Name first, on purpose — the kind is the easy part. */
export function PursuitModal({ open, area, onClose, onCreate }: PursuitModalProps) {
  return (
    <Modal open={open} title={area.modalTitle} subtitle={area.modalSubtitle} onClose={onClose}>
      <PursuitForm area={area} onClose={onClose} onCreate={onCreate} />
    </Modal>
  )
}
