import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './Input.module.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Right of the label — a character counter, a hint, an optional marker. */
  trailing?: ReactNode
}

export function Input({ label, trailing, id, className, ...rest }: InputProps) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
      </div>
      <input id={inputId} className={styles.input} {...rest} />
    </div>
  )
}
