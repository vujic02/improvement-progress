import { Fragment } from 'react'
import { Icon } from './Icon'
import { IconButton } from './IconButton'
import styles from './Navbar.module.css'

export interface NavbarProps {
  /** Breadcrumb segments, coarsest first. The last one is the page name. */
  trail: string[]
  user: string
  onSignOut?: () => void
}

export function Navbar({ trail, user, onSignOut }: NavbarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <nav className={styles.trail} aria-label="Breadcrumb">
          {trail.map((crumb, i) => (
            <Fragment key={crumb}>
              {i > 0 ? <span aria-hidden="true">/</span> : null}
              <span className={i === trail.length - 1 ? styles.crumbLast : undefined}>{crumb}</span>
            </Fragment>
          ))}
        </nav>
      </div>
      <div className={styles.right}>
        <IconButton icon="search" label="Search" size={18} />
        <IconButton icon="bell" label="Notifications" size={18} />
        <IconButton icon="settings" label="Settings" size={18} />
        <span className={styles.user}>
          <Icon name="person" size={16} />
          {user}
        </span>
        {onSignOut ? <IconButton icon="key" label="Sign out" size={18} onClick={onSignOut} /> : null}
      </div>
    </header>
  )
}
