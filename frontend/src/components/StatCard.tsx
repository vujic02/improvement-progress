import { GlassCard } from './GlassCard'
import { IconTile } from './IconTile'
import type { IconName } from './Icon'
import styles from './StatCard.module.css'

export interface StatCardProps {
  label: string
  value: string
  /** e.g. "+6%" — green by default, pink when it starts with "-". */
  delta?: string
  /**
   * Overrides that default. `neutral` is for figures where a bigger number is
   * not a win — money paid out reads wrong in gain-green.
   */
  deltaTone?: 'up' | 'down' | 'neutral'
  icon: IconName
}

/** KPI tile in the row under the dashboard header. */
export function StatCard({ label, value, delta, deltaTone, icon }: StatCardProps) {
  const tone = deltaTone ?? (delta?.startsWith('-') ? 'down' : 'up')
  const down = tone === 'down'
  const neutral = tone === 'neutral'
  return (
    <GlassCard padding="18px 20px" className={styles.card}>
      <div className={styles.text}>
        <span className={styles.label}>{label}</span>
        <div className={styles.valueRow}>
          <span className={styles.value}>{value}</span>
          {delta ? (
            <span
              className={[
                styles.delta,
                down ? styles.deltaDown : '',
                neutral ? styles.deltaNeutral : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {delta}
            </span>
          ) : null}
        </div>
      </div>
      <IconTile icon={icon} size={45} tone="accent" />
    </GlassCard>
  )
}
