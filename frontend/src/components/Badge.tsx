import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export interface BadgeProps {
  children: ReactNode
  /** Any CSS colour or var(); defaults to the raised surface. */
  color?: string
}

export function Badge({ children, color = 'rgba(255,255,255,.08)' }: BadgeProps) {
  return (
    <span className={styles.badge} style={{ background: color }}>
      {children}
    </span>
  )
}
