import { useState, type FormEvent } from 'react'
import { Button, Input, Modal } from '../../components'
import { parseAmount, type Pursuit } from '../../data/pursuits'
import {
  CADENCES,
  CADENCE_LABELS,
  DAYS_INTERVAL_MAX,
  WEEKS_INTERVAL_MAX,
  scheduleText,
  usesInterval,
  usesWeekdays,
  type Cadence,
  type Routine,
  type RoutineForm,
} from '../../data/routines'
import type { TaskType } from '../../data/taskTypes'
import { TASK_LABEL_MAX } from '../../days/context'
import { DAY_NAMES } from '../../lib/date'
import { useMoney } from '../../pursuits/useMoney'
import type { Result } from '../../session/context'
import styles from './RoutineModal.module.css'

/** One page's goals, as the goal picker groups them. */
export interface GoalGroup {
  label: string
  /** A money page: a tick pays the goal, so the form asks for an amount. */
  money: boolean
  goals: Pursuit[]
}

export interface RoutineModalProps {
  open: boolean
  /** The routine being edited. Absent, the modal creates a new one. */
  editing?: Routine
  types: TaskType[]
  /** Every goal the routine could count toward, a group per page. */
  goalGroups: GoalGroup[]
  onClose: () => void
  onSubmit: (form: RoutineForm) => Promise<Result>
}

/** A number field's value, or undefined when it is blank or not a whole number. */
const wholeNumber = (raw: string) => {
  const n = Number(raw.trim())
  return raw.trim() && Number.isInteger(n) ? n : undefined
}

/**
 * The fields. Mounted only while the dialog is open, so every open starts from
 * the routine being edited, or blank — no reset effect needed.
 */
function RoutineFields({
  editing,
  types,
  goalGroups,
  onClose,
  onSubmit,
}: Omit<RoutineModalProps, 'open'>) {
  const { symbol } = useMoney()
  const [label, setLabel] = useState(editing?.label ?? '')
  const [typeId, setTypeId] = useState(editing?.typeId ?? types[0]?.id ?? '')
  const [cadence, setCadence] = useState<Cadence>(editing?.cadence ?? 'daily')
  // Weekday picks survive a switch to another cadence and back, so trying
  // "every few weeks" does not lose the days already chosen.
  const [weekdays, setWeekdays] = useState<number[]>(editing?.weekdays ?? [])
  const [dayOfMonth, setDayOfMonth] = useState(String(editing?.dayOfMonth ?? 1))
  const [interval, setInterval] = useState(String(editing?.interval ?? 2))
  const [pursuitId, setPursuitId] = useState(editing?.pursuitId ?? '')
  const [amount, setAmount] = useState(editing?.amount === undefined ? '' : String(editing.amount))
  const [error, setError] = useState<string | null>(null)
  // A write in flight — a second press would send it twice.
  const [saving, setSaving] = useState(false)

  const group = goalGroups.find((g) => g.goals.some((goal) => goal.id === pursuitId))
  // A linked goal whose page has not loaded is kept as it is, amount included,
  // rather than silently unlinked by a save.
  const unknown = Boolean(pursuitId) && !group
  const money = group ? group.money : unknown && editing?.amount !== undefined
  const typed = parseAmount(amount)

  const form: RoutineForm = {
    label,
    typeId,
    cadence,
    weekdays,
    dayOfMonth: wholeNumber(dayOfMonth),
    interval: wholeNumber(interval),
    pursuitId: pursuitId || undefined,
    amount: money && typed !== null ? typed : undefined,
  }

  const toggleDay = (day: number) => {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
    setError(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    const result = await onSubmit(form)
    setSaving(false)
    if (result.ok) onClose()
    else setError(result.reason)
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Input
        label="Task"
        value={label}
        maxLength={TASK_LABEL_MAX}
        placeholder="e.g. Read 20 pages"
        autoFocus
        onChange={(e) => {
          setLabel(e.target.value)
          setError(null)
        }}
        trailing={`${label.length}/${TASK_LABEL_MAX}`}
      />

      <div className={styles.pair}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Type</span>
          <select
            className={styles.select}
            value={typeId}
            onChange={(e) => {
              setTypeId(e.target.value)
              setError(null)
            }}
          >
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Repeats</span>
          <select
            className={styles.select}
            value={cadence}
            onChange={(e) => {
              setCadence(e.target.value as Cadence)
              setError(null)
            }}
          >
            {CADENCES.map((option) => (
              <option key={option} value={option}>
                {CADENCE_LABELS[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {usesInterval(cadence) ? (
        <Input
          label={cadence === 'every-n-days' ? 'Every how many days' : 'Every how many weeks'}
          type="number"
          inputMode="numeric"
          min={2}
          max={cadence === 'every-n-days' ? DAYS_INTERVAL_MAX : WEEKS_INTERVAL_MAX}
          step={1}
          value={interval}
          onChange={(e) => {
            setInterval(e.target.value)
            setError(null)
          }}
          trailing={cadence === 'every-n-days' ? 'Counted from today' : 'Counted from this week'}
        />
      ) : null}

      {usesWeekdays(cadence) ? (
        <fieldset className={styles.days}>
          <legend className={styles.fieldLabel}>On</legend>
          <div className={styles.dayRow}>
            {DAY_NAMES.map((name, day) => {
              const on = weekdays.includes(day)
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  aria-label={name}
                  className={[styles.day, on ? styles.dayOn : ''].filter(Boolean).join(' ')}
                  onClick={() => toggleDay(day)}
                >
                  {name.slice(0, 3)}
                </button>
              )
            })}
          </div>
        </fieldset>
      ) : null}

      {cadence === 'month-day' ? (
        <Input
          label="Day of the month"
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          step={1}
          value={dayOfMonth}
          onChange={(e) => {
            setDayOfMonth(e.target.value)
            setError(null)
          }}
          trailing="The 31st falls back to the last day"
        />
      ) : null}

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Counts toward</span>
        <select
          className={styles.select}
          value={pursuitId}
          onChange={(e) => {
            setPursuitId(e.target.value)
            setError(null)
          }}
        >
          <option value="">No goal</option>
          {unknown ? <option value={pursuitId}>The goal it is linked to</option> : null}
          {goalGroups.map((g) =>
            g.goals.length ? (
              <optgroup key={g.label} label={g.label}>
                {g.goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </optgroup>
            ) : null,
          )}
        </select>
        {pursuitId ? (
          <span className={styles.hint}>
            {money
              ? 'Ticking it ticks the goal’s next unpaid payment; unticking takes it back.'
              : 'The goal’s card shows how consistently you tick it.'}
          </span>
        ) : null}
      </label>

      {pursuitId && money ? (
        <Input
          label={`Amount (${symbol})`}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={amount}
          placeholder="Optional"
          onChange={(e) => {
            setAmount(e.target.value)
            setError(null)
          }}
          trailing="Added once no payments are left"
        />
      ) : null}

      <span className={styles.summary}>
        {scheduleText(form)}
        {editing ? '. Past days keep what they had; today follows if you have not touched it.' : ', starting today.'}
      </span>

      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" size="md" disabled={saving}>
          {saving ? (editing ? 'Saving…' : 'Adding…') : editing ? 'Save changes' : 'Add recurring task'}
        </Button>
        <Button type="button" variant="subtle" size="md" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/** Create a recurring task, or edit one. Keyed on the routine so switching edits starts fresh. */
export function RoutineModal({
  open,
  editing,
  types,
  goalGroups,
  onClose,
  onSubmit,
}: RoutineModalProps) {
  return (
    <Modal
      open={open}
      title={editing ? `Edit ${editing.label}` : 'New recurring task'}
      subtitle={
        editing
          ? 'Changes apply from today on.'
          : 'It shows up unticked on every day it runs — even days you did not open the app.'
      }
      onClose={onClose}
    >
      <RoutineFields
        key={editing?.id ?? 'new'}
        editing={editing}
        types={types}
        goalGroups={goalGroups}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}
