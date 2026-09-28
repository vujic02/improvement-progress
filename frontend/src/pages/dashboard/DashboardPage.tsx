import { useMemo, useState } from 'react'
import { CategoryCard, SegmentedToggle, StatCard, type IconName } from '../../components'
import { useDays } from '../../days/context'
import { useMonthData } from '../../data/useMonthData'
import { useWeekData } from '../../data/useWeekData'
import type { DayTask } from '../../days/context'
import { APP_NAME } from '../../lib/brand'
import { DAY_NAMES, monthTitle, toDateInput } from '../../lib/date'
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

/**
 * Days in a row, counting back from today, with at least one task done. Today
 * not being finished yet does not break the run, so an untouched today counts
 * as the streak standing rather than ending.
 *
 * The store only holds this month and this week, so a longer run is reported
 * as "12+" rather than a number the loaded range cannot back up.
 */
function countStreak(now: Date, from: string, tasks: DayTask[]): string {
  const done = new Set(tasks.filter((task) => task.done).map((task) => task.day))
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let streak = 0

  if (!done.has(toDateInput(day))) day.setDate(day.getDate() - 1)
  while (done.has(toDateInput(day))) {
    streak += 1
    day.setDate(day.getDate() - 1)
  }

  return toDateInput(day) < from ? `${streak}+` : String(streak)
}

export interface DashboardPageProps {
  defaultView?: View
}

export function DashboardPage({ defaultView = 'month' }: DashboardPageProps) {
  const { all: types } = useTaskTypes()
  const { tasks: all, today: tasks, range, loading: daysLoading } = useDays()
  const [view, setView] = useState<View>(defaultView)

  const now = useMemo(() => new Date(), [])
  const month = useMonthData(now, types, all)
  const week = useWeekData(now, types, all)
  const streak = useMemo(() => countStreak(now, range.from, all), [now, range.from, all])

  const doneToday = tasks.filter((t) => t.done).length
  const donePct = tasks.length ? Math.round((doneToday / tasks.length) * 100) : 0
  const tally = daysLoading
    ? 'loading your day'
    : tasks.length
      ? `${doneToday} of ${tasks.length} tasks done, ${tasks.length - doneToday} still open`
      : 'nothing logged yet'
  const todayLine = `${DAY_NAMES[now.getDay()]} ${now.getDate()} — ${tally}`

  return (
    <DashboardLayout activeId="dashboard" trail={[APP_NAME, 'Dashboard']}>
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
          delta={`${donePct}%`}
          icon="checkmarkCircle"
        />
        <StatCard label="Month progress" value={`${month.monthPct}%`} icon="statsChart" />
        <StatCard label="Day streak" value={streak} icon="rocket" />
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
        <MonthView month={month} monthLabel={monthTitle(now)} todayLine={todayLine} />
      ) : (
        <WeekView week={week} todayLine={todayLine} />
      )}
    </DashboardLayout>
  )
}
