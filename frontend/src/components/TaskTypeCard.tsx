import { GlassCard } from './GlassCard'
import { IconButton } from './IconButton'
import { IconTile } from './IconTile'
import type { IconName } from './Icon'
import styles from './TaskTypeCard.module.css'

export interface TaskTypeCardProps {
  label: string
  icon: IconName
  /** Tint for the icon tile and the swatch dot. */
  color: string
  /** Shown under the name — "Default" or "Yours". */
  meta: string
  /** Omit for defaults, which cannot be removed. */
  onRemove?: () => void
}

/** One task type, as shown in both the defaults and the custom grid. */
export function TaskTypeCard({ label, icon, color, meta, onRemove }: TaskTypeCardProps) {
  return (
    <GlassCard padding="16px 18px" className={styles.card}>
      <IconTile icon={icon} size={42} radius={12} tone="raised" color={color} />
      <div className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={styles.meta}>
          <span className={styles.swatch} style={{ background: color }} />
          {meta}
        </span>
      </div>
      {onRemove ? (
        <IconButton
          icon="trash"
          label={`Remove ${label}`}
          size={18}
          className={styles.remove}
          onClick={onRemove}
        />
      ) : null}
    </GlassCard>
  )
}
