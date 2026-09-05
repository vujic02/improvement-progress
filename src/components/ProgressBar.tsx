import styles from './ProgressBar.module.css'

export interface ProgressBarProps {
  /** 0–100. Clamped. */
  value: number
  height?: number
  /** Fill colour or gradient. */
  color?: string
  trackColor?: string
  label?: string
}

export function ProgressBar({
  value,
  height = 6,
  color = 'var(--accent)',
  trackColor = 'var(--surface-track)',
  label,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      className={styles.track}
      style={{ height, background: trackColor }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={styles.fill} style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}
