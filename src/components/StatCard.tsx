import { GlassCard } from './GlassCard'
import { IconTile } from './IconTile'
import type { IconName } from './Icon'
import styles from './StatCard.module.css'

export interface StatCardProps {
  label: string
  value: string
  /** e.g. "+6%" — rendered green, or pink when it starts with "-". */
  delta?: string
  icon: IconName
}

/** KPI tile in the row under the dashboard header. */
export function StatCard({ label, value, delta, icon }: StatCardProps) {
  const down = delta?.startsWith('-')
  return (
    <GlassCard padding="18px 20px" className={styles.card}>
      <div className={styles.text}>
        <span className={styles.label}>{label}</span>
        <div className={styles.valueRow}>
          <span className={styles.value}>{value}</span>
          {delta ? (
            <span className={[styles.delta, down ? styles.deltaDown : ''].filter(Boolean).join(' ')}>
              {delta}
            </span>
          ) : null}
        </div>
      </div>
      <IconTile icon={icon} size={45} tone="accent" />
    </GlassCard>
  )
}
