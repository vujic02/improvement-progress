import type { CSSProperties } from 'react'
import { Icon, SegmentedToggle, Switch } from '../../components'
import {
  CADENCES,
  MONTH_DAY_MAX,
  cadenceSummary,
  ordinal,
  type Cadence,
  type Reminder,
} from '../../data/reminders'
import { DAY_NAMES } from '../../lib/date'
import styles from './ReminderRow.module.css'

const CADENCE_OPTIONS = CADENCES.map((value) => ({
  value,
  label: value[0].toUpperCase() + value.slice(1),
}))

const MONTH_DAYS = Array.from({ length: MONTH_DAY_MAX }, (_, i) => i + 1)

export interface ReminderRowProps {
  reminder: Reminder
  /** Master switch is off — the row still reads, but nothing will fire. */
  paused: boolean
  onChange: (patch: Partial<Reminder>) => void
}

/**
 * One reminder in the settings list: a switch, and — for the scheduled ones —
 * the controls for when it goes out. Event reminders show their trigger
 * instead, because there is nothing to schedule.
 */
export function ReminderRow({ reminder, paused, onChange }: ReminderRowProps) {
  const { enabled, scheduled, cadence, color } = reminder
  const showSchedule = enabled && scheduled

  return (
    <div
      className={[styles.row, enabled ? '' : styles.off, paused ? styles.paused : '']
        .filter(Boolean)
        .join(' ')}
      style={{ '--tint': color } as CSSProperties}
    >
      <div className={styles.head}>
        <span className={styles.tile}>
          <Icon name={reminder.icon} size={19} />
        </span>

        <div className={styles.text}>
          <span className={styles.title}>{reminder.title}</span>
          <span className={styles.body}>{reminder.body}</span>
        </div>

        <div className={styles.toggle}>
          <Switch
            checked={enabled}
            onChange={(on) => onChange({ enabled: on })}
            label={`${reminder.title} reminder`}
          />
        </div>
      </div>

      {showSchedule ? (
        <div className={styles.schedule}>
          <SegmentedToggle
            options={CADENCE_OPTIONS}
            value={cadence}
            onChange={(next: Cadence) => onChange({ cadence: next })}
            size="sm"
            label={`How often to send ${reminder.title}`}
          />

          {cadence === 'weekly' ? (
            <label className={styles.control}>
              <span className={styles.controlLabel}>on</span>
              <select
                className={styles.select}
                value={reminder.weekday}
                aria-label={`Day of the week for ${reminder.title}`}
                onChange={(e) => onChange({ weekday: Number(e.target.value) })}
              >
                {DAY_NAMES.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {cadence === 'monthly' ? (
            <label className={styles.control}>
              <span className={styles.controlLabel}>on the</span>
              <select
                className={styles.select}
                value={reminder.dayOfMonth}
                aria-label={`Day of the month for ${reminder.title}`}
                onChange={(e) => onChange({ dayOfMonth: Number(e.target.value) })}
              >
                {MONTH_DAYS.map((day) => (
                  <option key={day} value={day}>
                    {ordinal(day)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className={styles.control}>
            <span className={styles.controlLabel}>at</span>
            <input
              className={styles.time}
              type="time"
              value={reminder.time}
              aria-label={`Time for ${reminder.title}`}
              onChange={(e) => onChange({ time: e.target.value })}
            />
          </label>
        </div>
      ) : (
        <span className={styles.summary}>
          <Icon name="clock" size={12} />
          {enabled ? cadenceSummary(reminder) : 'Off'}
        </span>
      )}
    </div>
  )
}
