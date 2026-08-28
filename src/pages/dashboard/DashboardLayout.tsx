import type { ReactNode } from 'react'
import { Footer, Navbar, Sidebar, type NavGroup, type NavItem } from '../../components'
import { APP_NAME } from '../../lib/brand'
import { hrefFor, navigate, type Route } from '../../router'
import { useSession } from '../../session/context'
import styles from './DashboardLayout.module.css'

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: 'home', label: 'Dashboard' },
  { id: 'savings', icon: 'wallet', label: 'Savings & investing' },
  { id: 'self', icon: 'rocket', label: 'Self-improvement' },
  { id: 'goals', icon: 'cube', label: 'Big goals & dreams' },
  { id: 'types', icon: 'documents', label: 'Task types' },
]

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Account',
    items: [
      { id: 'profile', icon: 'person', label: 'Profile' },
      { id: 'signout', icon: 'key', label: 'Sign out' },
    ],
  },
]

/** Nav ids that have a page behind them. The rest stay inert until they do. */
const NAV_ROUTES: Partial<Record<string, Route>> = {
  dashboard: 'dashboard',
  types: 'task-types',
}

const FOOTER_NOTE = `${APP_NAME} — your month, your day, your call.`

const FOOTER_LINKS = [
  { label: 'Dashboard', href: hrefFor('dashboard') },
  { label: 'Task types', href: hrefFor('task-types') },
]

export interface DashboardLayoutProps {
  /** Which sidebar item to mark current. */
  activeId: string
  /** Breadcrumb segments, coarsest first. */
  trail: string[]
  /** Navbar title, usually the last breadcrumb. */
  title: string
  children: ReactNode
}

/** Sidebar, navbar, backdrop and footer — the chrome every signed-in page sits in. */
export function DashboardLayout({ activeId, trail, title, children }: DashboardLayoutProps) {
  const { userName, signOut } = useSession()

  const leave = () => {
    signOut()
    navigate('signin')
  }

  const handleNav = (id: string) => {
    if (id === 'signout') {
      leave()
      return
    }
    const route = NAV_ROUTES[id]
    if (route) navigate(route)
  }

  return (
    <div className={styles.shell}>
      <div className={styles.blob} />

      <Sidebar
        wordmark={APP_NAME}
        items={NAV_ITEMS}
        groups={NAV_GROUPS}
        activeId={activeId}
        onSelect={handleNav}
        className={styles.sidebar}
      />

      <div className={styles.main}>
        <Navbar trail={trail} title={title} user={userName} onSignOut={leave} />
        {children}
        <Footer note={FOOTER_NOTE} links={FOOTER_LINKS} />
      </div>
    </div>
  )
}
