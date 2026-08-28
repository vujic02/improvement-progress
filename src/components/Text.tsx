import type { CSSProperties, ReactNode } from 'react'
import styles from './Text.module.css'

export interface EyebrowProps {
  children: ReactNode
  /** Overrides the muted default — category cards tint theirs. */
  color?: string
  className?: string
  style?: CSSProperties
}

/** The tiny 10px uppercase label used above almost every block. */
export function Eyebrow({ children, color, className, style }: EyebrowProps) {
  return (
    <span
      className={[styles.eyebrow, className].filter(Boolean).join(' ')}
      style={{ ...(color ? { color } : null), ...style }}
    >
      {children}
    </span>
  )
}

export interface SectionHeadingProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Right-hand slot for a button or overflow menu. */
  action?: ReactNode
  className?: string
  style?: CSSProperties
}

/** Card header: title over an optional muted line, with an optional action. */
export function SectionHeading({ title, subtitle, action, className, style }: SectionHeadingProps) {
  const heading = (
    <div className={styles.heading}>
      <span className={styles.title}>{title}</span>
      {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
    </div>
  )

  if (!action) {
    return (
      <div className={className} style={style}>
        {heading}
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 20,
        ...style,
      }}
    >
      {heading}
      {action}
    </div>
  )
}
