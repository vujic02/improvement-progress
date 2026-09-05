import { Eyebrow } from './Text'
import { IconTile } from './IconTile'
import type { IconName } from './Icon'
import styles from './CategoryCard.module.css'

export interface CategoryCardProps {
  eyebrow: string
  /** Tint for the eyebrow — one accent per category. */
  eyebrowColor: string
  title: string
  icon: IconName
  image: string
  onOpen?: () => void
}

/** Photo tile linking to a life area (savings, self-improvement, goals). */
export function CategoryCard({
  eyebrow,
  eyebrowColor,
  title,
  icon,
  image,
  onOpen,
}: CategoryCardProps) {
  return (
    <button type="button" className={styles.card} onClick={onOpen}>
      <img className={styles.image} src={image} alt="" />
      <span className={styles.scrim} />
      <span className={styles.top}>
        <span className={styles.titles}>
          <Eyebrow color={eyebrowColor}>{eyebrow}</Eyebrow>
          <span className={styles.title}>{title}</span>
        </span>
        <IconTile icon={icon} size={45} tone="accent" />
      </span>
      <span className={styles.cta}>Open page →</span>
    </button>
  )
}
