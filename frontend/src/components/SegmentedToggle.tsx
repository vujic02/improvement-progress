import type { CSSProperties } from 'react'
import styles from './SegmentedToggle.module.css'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

export interface SegmentedToggleProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  /** Split the full width evenly between options (auth tabs). */
  grow?: boolean
  label?: string
  style?: CSSProperties
}

/** Pill switcher — sign in / register, and weekly / monthly. */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  grow,
  label,
  style,
}: SegmentedToggleProps<T>) {
  return (
    <div
      className={[styles.group, grow ? styles.grow : ''].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={label}
      style={style}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={[styles.option, styles[size], selected ? styles.selected : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
