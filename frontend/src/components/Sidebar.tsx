import type { CSSProperties } from 'react'
import { Eyebrow } from './Text'
import { IconTile } from './IconTile'
import type { IconName } from './Icon'
import styles from './Sidebar.module.css'

export interface NavItem {
  id: string
  label: string
  icon: IconName
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface SidebarProps {
  wordmark: string
  items: NavItem[]
  groups?: NavGroup[]
  activeId: string
  onSelect: (id: string) => void
  className?: string
  style?: CSSProperties
}

export function Sidebar({
  wordmark,
  items,
  groups = [],
  activeId,
  onSelect,
  className,
  style,
}: SidebarProps) {
  const renderItem = (item: NavItem) => {
    const active = item.id === activeId
    return (
      <button
        key={item.id}
        type="button"
        aria-current={active ? 'page' : undefined}
        className={[styles.item, active ? styles.active : ''].filter(Boolean).join(' ')}
        onClick={() => onSelect(item.id)}
      >
        <IconTile
          icon={item.icon}
          size={30}
          radius={10}
          tone={active ? 'accent' : 'raised'}
          color={active ? undefined : 'var(--text-muted)'}
        />
        <span className={styles.label}>{item.label}</span>
      </button>
    )
  }

  return (
    <nav
      className={[styles.sidebar, className].filter(Boolean).join(' ')}
      style={style}
      aria-label="Main"
    >
      <span className={styles.wordmark}>{wordmark}</span>
      <div className={styles.rule} />
      <div className={styles.group}>{items.map(renderItem)}</div>
      {groups.map((group) => (
        <div key={group.label} className={styles.group}>
          <Eyebrow className={styles.groupLabel}>{group.label}</Eyebrow>
          {group.items.map(renderItem)}
        </div>
      ))}
    </nav>
  )
}
