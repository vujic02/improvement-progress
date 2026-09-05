import { useId } from 'react'
import styles from './Switch.module.css'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  const id = useId()
  return (
    <div className={styles.row}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        className={[styles.track, checked ? styles.on : ''].filter(Boolean).join(' ')}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.knob} />
      </button>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
    </div>
  )
}
