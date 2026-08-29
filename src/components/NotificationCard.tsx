import type { CSSProperties, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { IconButton } from './IconButton'
import styles from './NotificationCard.module.css'

export interface NotificationCardProps {
  icon: IconName
  title: string
  body: string
  /** The schedule line — "Monthly on the 1st · 09:00". */
  meta?: string
  /** Tints the rail, the glow, the tile and the meta line. */
  color?: string
  /** Pulsing dot beside the title, for a reminder that is actually armed. */
  live?: boolean
  /** Dimmed and desaturated — a switched-off reminder previewing itself. */
  muted?: boolean
  onDismiss?: () => void
  /** Extra control on the right, e.g. a Switch. */
  action?: ReactNode
  className?: string
}

/**
 * A reminder as the user will see it: tinted rail, glow bleeding in from the
 * left, icon, title, body and the schedule that triggered it. Used both for
 * live notifications and for previewing one while it is being configured.
 */
export function NotificationCard({
  icon,
  title,
  body,
  meta,
  color = 'var(--accent)',
  live,
  muted,
  onDismiss,
  action,
  className,
}: NotificationCardProps) {
  return (
    <div
      className={[styles.card, muted ? styles.muted : '', className].filter(Boolean).join(' ')}
      style={{ '--tint': color, color } as CSSProperties}
      role="status"
    >
      <span className={styles.tile}>
        <Icon name={icon} size={19} />
      </span>

      <div className={styles.text}>
        <div className={styles.titleRow}>
          {live ? <span className={styles.live} aria-hidden="true" /> : null}
          <span className={styles.title}>{title}</span>
        </div>
        <span className={styles.body}>{body}</span>
        {meta ? (
          <span className={styles.meta}>
            <Icon name="clock" size={12} />
            {meta}
          </span>
        ) : null}
      </div>

      {action || onDismiss ? (
        <div className={styles.actions}>
          {action}
          {onDismiss ? (
            <IconButton icon="close" label={`Dismiss ${title}`} size={16} onClick={onDismiss} />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
