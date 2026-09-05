import styles from './CheckSquare.module.css'

export interface CheckSquareProps {
  checked: boolean
  /** Fill colour when checked. */
  color: string
  size?: number
  /** Renders the faint future-day ring and blocks interaction. */
  muted?: boolean
  /** Fill the grid track instead of sitting at `size` wide. */
  stretch?: boolean
  onToggle?: () => void
  label?: string
}

/**
 * The filled/outlined square that marks a done task — task rows, day cards and
 * every cell of the habit grid. Renders as a button only when it can be toggled.
 */
export function CheckSquare({
  checked,
  color,
  size = 20,
  muted = false,
  stretch = false,
  onToggle,
  label,
}: CheckSquareProps) {
  const ringColor = muted ? 'var(--line)' : 'var(--line-strong)'
  const style = {
    display: 'block',
    width: stretch ? '100%' : size,
    height: size,
    background: checked && !muted ? color : 'transparent',
    boxShadow: checked && !muted ? 'none' : `inset 0 0 0 1px ${ringColor}`,
  }

  if (!onToggle) {
    return <span className={styles.box} style={style} aria-hidden="true" />
  }

  return (
    <button
      type="button"
      className={`${styles.box} ${styles.interactive}`}
      style={style}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
    />
  )
}
