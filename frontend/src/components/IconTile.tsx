import { Icon, type IconName } from './Icon'
import styles from './IconTile.module.css'

export interface IconTileProps {
  icon: IconName
  /** Outer square, px. The glyph is drawn at half. */
  size?: number
  radius?: number
  tone?: 'accent' | 'raised' | 'plain'
  /** Glyph colour; ignored for `accent`, which is always white-on-blue. */
  color?: string
}

/** Rounded square that frames a single icon — category cards, habit rows, nav. */
export function IconTile({ icon, size = 45, radius = 12, tone = 'accent', color }: IconTileProps) {
  return (
    <span
      className={[styles.tile, styles[tone]].join(' ')}
      style={{ width: size, height: size, borderRadius: radius, color }}
    >
      <Icon name={icon} size={Math.round(size * 0.5)} />
    </span>
  )
}
