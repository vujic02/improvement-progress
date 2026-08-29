import { useMemo, useState } from 'react'
import { CategoryCard, SegmentedToggle, StatCard, type IconName } from '../../components'
import { TODAY_TASKS, type DayTask } from '../../data/tasks'
import { useMonthData } from '../../data/useMonthData'
import { useWeekData } from '../../data/useWeekData'
import { APP_NAME } from '../../lib/brand'
import { DAY_NAMES, monthTitle } from '../../lib/date'
import { navigate, type Route } from '../../router'
import { useTaskTypes } from '../../taskTypes/context'
import { DashboardLayout } from './DashboardLayout'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import styles from './DashboardPage.module.css'

type View = 'month' | 'week'

const VIEW_OPTIONS = [
  { value: 'week' as const, label: 'Weekly' },
  { value: 'month' as const, label: 'Monthly' },
]

interface Category {
  id: string
  eyebrow: string
  eyebrowColor: string
  title: string
  icon: IconName
  image: string
  /** Set once the area has a page; the rest are still art. */
  route?: Route
}

const CATEGORIES: Category[] = [
  {
    id: 'savings',
    route: 'savings',
    eyebrow: 'Wealth',
    eyebrowColor: 'var(--accent-cyan)',
    title: 'Savings & investing',
    icon: 'wallet',
    image: '/assets/img/art-glow-blue.jpg',
  },
  {
    id: 'self',
    route: 'self-improvement',
    eyebrow: 'Growth',
    eyebrowColor: 'var(--accent-teal)',
    title: 'Self-improvement',
    icon: 'rocket',
    image: '/assets/img/art-jellyfish-blue.jpg',
  },
  {
    id: 'goals',
    route: 'dreams',
    eyebrow: 'Horizon',
    eyebrowColor: 'var(--accent-violet)',
    title: 'Big goals & dreams',
    icon: 'cube',
    image: '/assets/img/art-jellyfish-violet.jpg',
  },
]

export interface DashboardPageProps {
  defaultView?: View
}

export function DashboardPage({ defaultView = 'month' }: DashboardPageProps) {
  const { all: types } = useTaskTypes()
  const [view, setView] = useState<View>(defaultView)
  const [tasks, setTasks] = useState<DayTask[]>(TODAY_TASKS)

  const now = useMemo(() => new Date(), [])
  const month = useMonthData(now, types)
  const week = useWeekData(now)

  const doneToday = tasks.filter((t) => t.done).length
  const todayLine = `${DAY_NAMES[now.getDay()]} ${now.getDate()} — ${doneToday} of ${tasks.length} tasks done, ${tasks.length - doneToday} still open`

  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  return (
    <DashboardLayout activeId="dashboard" trail={[APP_NAME, 'Dashboard']} title="Dashboard">
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
        <StatCard label="Task types" value={String(types.length)} icon="cube" />
      </div>

      <div className={styles.categories}>
        {CATEGORIES.map(({ id, route, ...category }) => (
          <CategoryCard
            key={id}
            {...category}
            onOpen={route ? () => navigate(route) : undefined}
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
    </DashboardLayout>
  )
}
