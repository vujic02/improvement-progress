import { Button, GlassCard, IconButton, ProgressBar, SectionHeading } from '../../components'
import type { MonthData } from '../../data/useMonthData'
import { useDays } from '../../days/context'
import { HabitGrid } from './HabitGrid'
import { TodayTasks } from './TodayTasks'
import styles from './views.module.css'

export interface MonthViewProps {
  month: MonthData
  monthLabel: string
  todayLine: string
}

export function MonthView({ month, monthLabel, todayLine }: MonthViewProps) {
  const { loading, error, reload } = useDays()
  // Rows are the types this month used, so an untouched month has none. The
  // card goes with them rather than framing an empty grid — but only once the
  // month has actually loaded, or it would flicker away and back on every visit.
  const hideGrid = !loading && !error && month.rows.length === 0

  return (
    <div className={styles.stack}>
      {!hideGrid ? (
        <GlassCard tone="b">
          <SectionHeading
            title="Habit grid"
            subtitle={`${monthLabel} — a cell fills when a task of that type is done`}
            action={<IconButton icon="moreHoriz" label="Habit grid options" size={24} />}
            style={{ marginBottom: 22 }}
          />
          {/* An empty grid and a grid that failed to load look identical. */}
          {loading ? (
            <span className={styles.stateLine}>Loading your month…</span>
          ) : error ? (
            <div className={styles.stateBlock}>
              <span className={styles.stateError} role="alert">
                Couldn't load your month. {error}
              </span>
              <Button size="sm" onClick={reload}>
                Try again
              </Button>
            </div>
          ) : (
            <HabitGrid month={month} />
          )}
        </GlassCard>
      ) : null}

      <div className={styles.monthSplit}>
        <TodayTasks subtitle={todayLine} />

        <GlassCard>
          <SectionHeading title="Analysis" subtitle="By task type, this month" />
          {/* This card holds its place: dropping it would leave the split
              lopsided, and "nothing yet" is the honest reading of an empty month. */}
          {!loading && !error && month.rows.length === 0 ? (
            <span className={styles.stateLine}>
              Nothing logged this month yet. Add a task and its type shows up here.
            </span>
          ) : null}
          <div className={styles.analysis}>
            {month.rows.map((row) => (
              <div key={row.id} className={styles.analysisRow}>
                <div className={styles.analysisHead}>
                  <span>{row.label}</span>
                  <span className={styles.analysisPct}>{row.pct}%</span>
                </div>
                <ProgressBar value={row.pct} color={row.color} label={row.label} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
