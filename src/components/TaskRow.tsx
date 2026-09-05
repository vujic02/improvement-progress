import { CheckSquare } from './CheckSquare'
import styles from './TaskRow.module.css'

export interface TaskRowProps {
  label: string
  /** Task-type name; hidden in compact mode. */
  type?: string
  color: string
  done: boolean
  /** Tighter padding and a single line — used in the narrow week column. */
  compact?: boolean
  onToggle?: () => void
}

/** One task line. Shared by the month list and the week list. */
export function TaskRow({ label, type, color, done, compact, onToggle }: TaskRowProps) {
  return (
    <div className={[styles.row, compact ? styles.compact : ''].filter(Boolean).join(' ')}>
      <CheckSquare
        checked={done}
        color={color}
        size={compact ? 18 : 20}
        onToggle={onToggle}
        label={label}
      />
      <div className={styles.text}>
        <span className={[styles.label, done ? styles.done : ''].filter(Boolean).join(' ')}>
          {label}
        </span>
        {type && !compact ? <span className={styles.type}>{type}</span> : null}
      </div>
      <span className={styles.dot} style={{ background: color }} />
    </div>
  )
}
