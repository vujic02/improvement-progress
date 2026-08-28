import { Eyebrow, Icon, type IconName } from '../../components'
import styles from './IconPicker.module.css'

export interface IconPickerProps {
  icons: IconName[]
  value: IconName
  onChange: (icon: IconName) => void
  label?: string
}

/** Single-select grid of icons for the create-a-type form. */
export function IconPicker({ icons, value, onChange, label = 'Icon' }: IconPickerProps) {
  return (
    <div className={styles.picker}>
      <Eyebrow>{label}</Eyebrow>
      <div className={styles.grid} role="radiogroup" aria-label={label}>
        {icons.map((icon) => {
          const selected = icon === value
          return (
            <button
              key={icon}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={icon}
              className={[styles.option, selected ? styles.selected : ''].filter(Boolean).join(' ')}
              onClick={() => onChange(icon)}
            >
              <Icon name={icon} size={20} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
