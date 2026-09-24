import { CheckSquare } from './CheckSquare'
import { IconButton } from './IconButton'
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
  /** Omit where a task cannot be deleted from; shows a trash button when set. */
  onRemove?: () => void
}

/** One task line. Shared by the month list and the week list. */
export function TaskRow({ label, type, color, done, compact, onToggle, onRemove }: TaskRowProps) {
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
      {onRemove ? (
        <IconButton
          icon="trash"
          label={`Delete ${label}`}
          size={compact ? 15 : 16}
          className={styles.remove}
          onClick={onRemove}
        />
      ) : null}
    </div>
  )
}
