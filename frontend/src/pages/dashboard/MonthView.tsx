import { GlassCard, IconButton, ProgressBar, SectionHeading } from '../../components'
import type { MonthData } from '../../data/useMonthData'
import { HabitGrid } from './HabitGrid'
import { TodayTasks } from './TodayTasks'
import styles from './views.module.css'

export interface MonthViewProps {
  month: MonthData
  monthLabel: string
  todayLine: string
}

export function MonthView({ month, monthLabel, todayLine }: MonthViewProps) {
  return (
    <div className={styles.stack}>
      <GlassCard tone="b">
        <SectionHeading
          title="Habit grid"
          subtitle={`${monthLabel} — tap a cell to log a day`}
          action={<IconButton icon="moreHoriz" label="Habit grid options" size={24} />}
          style={{ marginBottom: 22 }}
        />
        <HabitGrid month={month} />
      </GlassCard>

      <div className={styles.monthSplit}>
        <TodayTasks subtitle={todayLine} />

        <GlassCard>
          <SectionHeading title="Analysis" subtitle="By task type, this month" />
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
