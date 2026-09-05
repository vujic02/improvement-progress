import styles from './DonutProgress.module.css'

export interface DonutProgressProps {
  /** 0–100. */
  value: number
  /** Outer diameter in px. Ring thickness scales with it. */
  size?: number
  /** Sweep colour, or the far end of a two-stop sweep when `from` is set. */
  color?: string
  from?: string
  caption?: string
  /** Overrides the "NN%" centre label. */
  valueLabel?: string
}

/** Conic-gradient ring used for the weekly total and each day card. */
export function DonutProgress({
  value,
  size = 108,
  color = 'var(--accent-cyan)',
  from,
  caption,
  valueLabel,
}: DonutProgressProps) {
  const pct = Math.max(0, Math.min(100, value))
  const deg = Math.round((pct / 100) * 360)
  const hole = Math.round(size * 0.78)
  const sweep = from
    ? `conic-gradient(from 0deg, ${from} 0deg, ${color} ${deg}deg, rgba(255,255,255,.07) ${deg}deg)`
    : `conic-gradient(from 0deg, ${color} ${deg}deg, rgba(255,255,255,.07) ${deg}deg)`

  return (
    <div
      className={styles.ring}
      style={{ width: size, height: size, background: sweep }}
      role="img"
      aria-label={`${Math.round(pct)}% complete${caption ? ` — ${caption}` : ''}`}
    >
      <div className={styles.hole} style={{ width: hole, height: hole }}>
        <span className={styles.value} style={{ fontSize: Math.round(size * 0.2) }}>
          {valueLabel ?? `${Math.round(pct)}%`}
        </span>
        {caption ? <span className={styles.caption}>{caption}</span> : null}
      </div>
    </div>
  )
}
