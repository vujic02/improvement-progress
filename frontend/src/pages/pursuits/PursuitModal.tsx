import { useState, type FormEvent } from 'react'
import { Button, Icon, Input, Modal } from '../../components'
import {
  DEFAULT_TARGET_MONTHS,
  PURSUIT_NAME_MAX,
  kindMeta,
  parseAmount,
  type Pursuit,
  type PursuitArea,
} from '../../data/pursuits'
import { daysBetween, mediumDate, parseDateInput, toDateInput } from '../../lib/date'
import type { NewPursuit, Result } from '../../pursuits/context'
import { useMoney } from '../../pursuits/useMoney'
import styles from './PursuitModal.module.css'

export interface PursuitModalProps {
  open: boolean
  area: PursuitArea
  /** The goal being edited. Absent, the modal creates a new one. */
  editing?: Pursuit
  onClose: () => void
  /**
   * Create or save. When editing, `saved` is never sent — the balance only
   * moves through contributions.
   */
  onSubmit: (pursuit: NewPursuit) => Promise<Result>
}

/** An amount as the field shows it: blank when there is none. */
const amountInput = (value: number | undefined) => (value === undefined ? '' : String(value))

function defaultTarget(from: Date): string {
  const d = new Date(from)
  d.setMonth(d.getMonth() + DEFAULT_TARGET_MONTHS)
  return toDateInput(d)
}

/**
 * The fields. Mounted only while the dialog is open, so every open starts from
 * the goal being edited, or blank with today's date — no reset effect needed.
 */
function PursuitForm({ area, editing, onClose, onSubmit }: Omit<PursuitModalProps, 'open'>) {
  const { format, symbol } = useMoney()
  const [name, setName] = useState(editing?.name ?? '')
  const [kind, setKind] = useState<string>(editing?.kind ?? area.kinds[0])
  const [targetInput, setTargetInput] = useState(amountInput(editing?.target))
  const [savedInput, setSavedInput] = useState('')
  const [createdAt, setCreatedAt] = useState(() => editing?.createdAt ?? toDateInput(new Date()))
  const [targetAt, setTargetAt] = useState(() => editing?.targetAt ?? defaultTarget(new Date()))
  const [error, setError] = useState<string | null>(null)
  // A write in flight — a second press would send it twice.
  const [saving, setSaving] = useState(false)

  const start = parseDateInput(createdAt)
  const target = parseDateInput(targetAt)
  const span = start && target ? daysBetween(start, target) : null

  const targetAmount = parseAmount(targetInput)
  // Editing shows the balance the goal already holds; it is not a field here.
  const savedAmount = editing ? (editing.saved ?? null) : parseAmount(savedInput)
  const left =
    area.money && targetAmount && Number.isFinite(targetAmount)
      ? targetAmount - (Number.isFinite(savedAmount ?? 0) ? (savedAmount ?? 0) : 0)
      : null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    if (area.money && (Number.isNaN(targetAmount) || Number.isNaN(savedAmount))) {
      setError('Amounts have to be numbers.')
      return
    }
    setSaving(true)
    const result = await onSubmit({
      name,
      kind,
      createdAt,
      targetAt,
      ...(area.money ? { target: targetAmount ?? undefined } : null),
      ...(area.money && !editing ? { saved: savedAmount ?? undefined } : null),
    })
    setSaving(false)
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
            trailing={`${symbol} · optional`}
          />
          {!editing ? (
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
              trailing={`${symbol} · optional`}
            />
          ) : null}
        </div>
      ) : null}

      {left !== null && Number.isFinite(left) ? (
        <span className={styles.span}>
          {left > 0
            ? `${format(left)} to go.`
            : left === 0
              ? 'Already there — the target is covered.'
              : `${format(-left)} past the target.`}
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
        <Button type="submit" size="md" disabled={saving}>
          {saving ? (editing ? 'Saving…' : 'Creating…') : editing ? 'Save changes' : 'Create goal'}
        </Button>
        <Button type="button" variant="subtle" size="md" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/**
 * Create a pursuit, or edit one. Name first, on purpose — the kind is the easy
 * part. Keyed on the goal so moving from one edit to another starts fresh.
 */
export function PursuitModal({ open, area, editing, onClose, onSubmit }: PursuitModalProps) {
  return (
    <Modal
      open={open}
      title={editing ? `Edit ${editing.name}` : area.modalTitle}
      subtitle={
        editing
          ? area.money
            ? 'Change anything but the balance — that moves through contributions.'
            : 'Steps stay as they are; change them on the card.'
          : area.modalSubtitle
      }
      onClose={onClose}
    >
      <PursuitForm
        key={editing?.id ?? 'new'}
        area={area}
        editing={editing}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}
