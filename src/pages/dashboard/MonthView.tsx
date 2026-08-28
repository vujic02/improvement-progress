import { Button, GlassCard, IconButton, ProgressBar, SectionHeading, TaskRow } from '../../components'
import { taskTypeById } from '../../data/taskTypes'
import type { DayTask } from '../../data/tasks'
import type { MonthData } from '../../data/useMonthData'
import { HabitGrid } from './HabitGrid'
import styles from './views.module.css'

export interface MonthViewProps {
  month: MonthData
  monthLabel: string
  todayLine: string
  tasks: DayTask[]
  onToggleTask: (id: string) => void
}

export function MonthView({ month, monthLabel, todayLine, tasks, onToggleTask }: MonthViewProps) {
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
        <GlassCard>
          <SectionHeading
            title="Today's tasks"
            subtitle={todayLine}
            action={
              <Button variant="ghost" size="sm" style={{ minWidth: 118 }}>
                Add task
              </Button>
            }
          />
          <div className={styles.taskList}>
            {tasks.map((task) => {
              const type = taskTypeById(task.type)
              return (
                <TaskRow
                  key={task.id}
                  label={task.label}
                  type={type.label}
                  color={type.color}
                  done={task.done}
                  onToggle={() => onToggleTask(task.id)}
                />
              )
            })}
          </div>
        </GlassCard>

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
