import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './IconButton.module.css'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  /** Required — this button has no visible text. */
  label: string
  size?: number
}

/** Bare square button used for card overflow menus and navbar actions. */
export function IconButton({ icon, label, size = 22, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[styles.button, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  )
}
