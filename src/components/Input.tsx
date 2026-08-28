import { useId, type InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Input({ label, id, className, ...rest }: InputProps) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input id={inputId} className={styles.input} {...rest} />
    </div>
  )
}
