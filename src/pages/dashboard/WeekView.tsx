import {
  Badge,
  Button,
  CheckSquare,
  DonutProgress,
  Eyebrow,
  GlassCard,
  MetricRow,
  SectionHeading,
  TaskRow,
} from '../../components'
import { taskTypeById } from '../../data/taskTypes'
import type { DayTask } from '../../data/tasks'
import type { WeekData } from '../../data/useWeekData'
import styles from './views.module.css'

export interface WeekViewProps {
  week: WeekData
  todayLine: string
  tasks: DayTask[]
  onToggleTask: (id: string) => void
}

export function WeekView({ week, todayLine, tasks, onToggleTask }: WeekViewProps) {
  return (
    <div className={styles.stack}>
      <div className={styles.weekSplit}>
        <GlassCard tone="b" className={styles.overall}>
          <div className={styles.overallLeft}>
            <SectionHeading title="Overall progress" subtitle={`Week of ${week.startLabel}`} />
            <div className={styles.weekBars}>
              {week.days.map((day) => (
                <div key={day.key} className={styles.weekBar}>
                  <div className={styles.weekBarTrack}>
                    <div
                      className={styles.weekBarFill}
                      style={{ height: `${Math.max(8, day.pct)}%`, background: day.tint }}
                    />
                  </div>
                  <span className={styles.weekBarLabel}>{day.short}</span>
                </div>
              ))}
            </div>
          </div>
          <DonutProgress
            value={week.pct}
            size={196}
            from="var(--accent)"
            color="var(--accent-cyan)"
            caption={`${week.done} of ${week.total} completed`}
          />
        </GlassCard>

        <GlassCard>
          <SectionHeading
            title="Today's tasks"
            subtitle={todayLine}
            action={
              <Button variant="ghost" size="sm" style={{ minWidth: 100 }}>
                Add task
              </Button>
            }
          />
          <div className={styles.compactList}>
            {tasks.map((task) => {
              const type = taskTypeById(task.type)
              return (
                <TaskRow
                  key={task.id}
                  label={task.label}
                  color={type.color}
                  done={task.done}
                  compact
                  onToggle={() => onToggleTask(task.id)}
                />
              )
            })}
          </div>
        </GlassCard>
      </div>

      <div className={styles.dayGrid}>
        {week.days.map((day) => (
          <GlassCard
            key={day.key}
            tone="b"
            padding="22px 16px 18px"
            className={styles.dayCard}
            style={{
              boxShadow: day.isToday ? 'inset 0 0 0 1px rgba(0,117,255,.55)' : undefined,
            }}
          >
            <div className={styles.dayHead}>
              <span className={styles.dayName}>{day.name}</span>
              <span className={styles.dayDate}>{day.date}</span>
            </div>

            <DonutProgress value={day.pct} size={108} color={day.tint} />

            <Badge color={day.badgeColor}>{day.badge}</Badge>

            <div className={styles.daySection}>
              <Eyebrow>Tasks</Eyebrow>
              {day.items.map((item) => (
                <div key={item.key} className={styles.dayTask}>
                  <CheckSquare
                    checked={item.done}
                    color={item.color}
                    size={14}
                    muted={day.future}
                  />
                  <span className={styles.dayTaskLabel}>{item.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.dayTally}>
              <span className={styles.tallyDone}>{day.doneCount} completed</span>
              <span className={styles.tallyOpen}>
                {day.items.length - day.doneCount} not completed
              </span>
            </div>

            <div className={styles.daySection} style={{ gap: 6 }}>
              <Eyebrow>Mindset</Eyebrow>
              <MetricRow label="Energy" value={day.energy} />
              <MetricRow label="Focus" value={day.focus} />
              <MetricRow label="Motivation" value={day.motivation} />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
