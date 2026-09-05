import type { ReactNode } from 'react'
import styles from './MetricRow.module.css'

export interface MetricRowProps {
  label: string
  value: ReactNode
}

/** Label-left / value-right line — mindset scores and any similar readout. */
export function MetricRow({ label, value }: MetricRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  )
}
