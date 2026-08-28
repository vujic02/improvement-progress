import { useMemo, useState } from 'react'
import {
  CategoryCard,
  Footer,
  Navbar,
  SegmentedToggle,
  Sidebar,
  StatCard,
  type NavGroup,
  type NavItem,
} from '../../components'
import { TODAY_TASKS, type DayTask } from '../../data/tasks'
import { useMonthData } from '../../data/useMonthData'
import { useWeekData } from '../../data/useWeekData'
import { DAY_NAMES, monthTitle } from '../../lib/date'
import { navigate } from '../../router'
import { useSession } from '../../session/context'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import styles from './DashboardPage.module.css'

type View = 'month' | 'week'

const VIEW_OPTIONS = [
  { value: 'week' as const, label: 'Weekly' },
  { value: 'month' as const, label: 'Monthly' },
]

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

const CATEGORIES = [
  {
    id: 'savings',
    eyebrow: 'Wealth',
    eyebrowColor: 'var(--accent-cyan)',
    title: 'Savings & investing',
    icon: 'wallet' as const,
    image: '/assets/img/art-glow-blue.jpg',
  },
  {
    id: 'self',
    eyebrow: 'Growth',
    eyebrowColor: 'var(--accent-teal)',
    title: 'Self-improvement',
    icon: 'rocket' as const,
    image: '/assets/img/art-jellyfish-blue.jpg',
  },
  {
    id: 'goals',
    eyebrow: 'Horizon',
    eyebrowColor: 'var(--accent-violet)',
    title: 'Big goals & dreams',
    icon: 'cube' as const,
    image: '/assets/img/art-jellyfish-violet.jpg',
  },
]

export interface DashboardPageProps {
  defaultView?: View
}

export function DashboardPage({ defaultView = 'month' }: DashboardPageProps) {
  const { userName, signOut } = useSession()
  const [view, setView] = useState<View>(defaultView)
  const [nav, setNav] = useState('dashboard')
  const [tasks, setTasks] = useState<DayTask[]>(TODAY_TASKS)

  const now = useMemo(() => new Date(), [])
  const month = useMonthData(now)
  const week = useWeekData(now)

  const doneToday = tasks.filter((t) => t.done).length
  const todayLine = `${DAY_NAMES[now.getDay()]} ${now.getDate()} — ${doneToday} of ${tasks.length} tasks done, ${tasks.length - doneToday} still open`

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const leave = () => {
    signOut()
    navigate('signin')
  }

  const handleNav = (id: string) => {
    if (id === 'signout') {
      leave()
      return
    }
    setNav(id)
  }

  return (
    <div className={styles.shell}>
      <div className={styles.blob} />

      <Sidebar
        wordmark="Jarvis"
        items={NAV_ITEMS}
        groups={NAV_GROUPS}
        activeId={nav}
        onSelect={handleNav}
        className={styles.sidebar}
      />

      <div className={styles.main}>
        <Navbar trail={['Jarvis', 'Dashboard']} title="Dashboard" user={userName} onSignOut={leave} />

        <div className={styles.pageHead}>
          <div className={styles.pageTitles}>
            <span className={styles.month}>{monthTitle(now)}</span>
            <span className={styles.today}>{todayLine}</span>
          </div>
          <SegmentedToggle
            options={VIEW_OPTIONS}
            value={view}
            onChange={setView}
            label="Dashboard range"
          />
        </div>

        <div className={styles.kpis}>
          <StatCard
            label="Tasks today"
            value={`${doneToday}/${tasks.length}`}
            delta={`+${Math.round((doneToday / tasks.length) * 100)}%`}
            icon="checkmarkCircle"
          />
          <StatCard label="Month progress" value={`${month.monthPct}%`} delta="+6%" icon="statsChart" />
          <StatCard label="Day streak" value="11" delta="+2" icon="rocket" />
          <StatCard label="Task types" value="6" delta="+1" icon="cube" />
        </div>

        <div className={styles.categories}>
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              eyebrow={category.eyebrow}
              eyebrowColor={category.eyebrowColor}
              title={category.title}
              icon={category.icon}
              image={category.image}
              onOpen={() => setNav(category.id)}
            />
          ))}
        </div>

        {view === 'month' ? (
          <MonthView
            month={month}
            monthLabel={monthTitle(now)}
            todayLine={todayLine}
            tasks={tasks}
            onToggleTask={toggleTask}
          />
        ) : (
          <WeekView week={week} todayLine={todayLine} tasks={tasks} onToggleTask={toggleTask} />
        )}

        <Footer
          note="Jarvis — your month, your day, your call."
          links={['Task types', 'Weekly', 'Monthly']}
        />
      </div>
    </div>
  )
}
