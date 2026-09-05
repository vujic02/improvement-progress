import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
  /** Stretch to the container width (auth CTA, social row). */
  block?: boolean
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  block,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], block ? styles.block : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
