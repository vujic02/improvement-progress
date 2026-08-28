import type { CSSProperties, ReactNode } from 'react'
import styles from './GlassCard.module.css'

const DEFAULT_PADDING = '28px 21px 26px'

export interface GlassCardProps {
  children: ReactNode
  /** `a` is the steeper 127deg panel, `b` the flatter 170deg one. */
  tone?: 'a' | 'b'
  /**
   * Inline so it always beats the card's own class, whatever order the CSS
   * modules end up in. Pass 0 when the card owns its layout.
   */
  padding?: CSSProperties['padding']
  className?: string
  style?: CSSProperties
}

/** The frosted panel every dashboard surface sits on. */
export function GlassCard({
  children,
  tone = 'a',
  padding = DEFAULT_PADDING,
  className,
  style,
}: GlassCardProps) {
  return (
    <div
      className={[styles.card, styles[tone], className].filter(Boolean).join(' ')}
      style={{ padding, ...style }}
    >
      {children}
    </div>
  )
}
