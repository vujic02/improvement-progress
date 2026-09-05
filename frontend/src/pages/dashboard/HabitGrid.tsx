import { CheckSquare, Eyebrow, IconTile } from '../../components'
import type { MonthData } from '../../data/useMonthData'
import styles from './HabitGrid.module.css'

export interface HabitGridProps {
  month: MonthData
}

/** Habit-type rows × days-of-month, with a daily-score strip underneath. */
export function HabitGrid({ month }: HabitGridProps) {
  const cols = { gridTemplateColumns: month.gridCols }

  return (
    <div className={styles.scroller}>
      <div className={styles.inner}>
        <div className={`${styles.row} ${styles.weekRow}`} style={cols}>
          <div />
          {month.weeks.map((week) => (
            <div
              key={week.idx}
              className={styles.weekChip}
              style={{ gridColumn: `span ${week.span}`, background: week.tint }}
            >
              {week.label}
            </div>
          ))}
        </div>

        <div className={styles.row} style={cols}>
          <Eyebrow>My habits</Eyebrow>
          {month.days.map((day) => (
            <div key={day.d} className={styles.dayHead}>
              <span className={styles.dayLetter}>{day.letter}</span>
              <span className={styles.dayNumber} style={{ color: day.numColor }}>
                {day.d}
              </span>
            </div>
          ))}
        </div>

        {month.rows.map((row) => (
          <div key={row.id} className={`${styles.row} ${styles.habitRow}`} style={cols}>
            <div className={styles.habitLabel}>
              <IconTile icon={row.icon} size={25} radius={6} tone="raised" color={row.color} />
              <span className={styles.habitName}>{row.label}</span>
            </div>
            {row.cells.map((cell) => (
              <div key={cell.key} className={styles.cell}>
                <CheckSquare
                  checked={cell.filled}
                  muted={cell.future}
                  color={cell.tint}
                  size={22}
                  stretch
                  onToggle={cell.toggle}
                  label={`${row.label}, day ${cell.day}`}
                />
              </div>
            ))}
          </div>
        ))}

        <div className={`${styles.row} ${styles.scoreRow}`} style={cols}>
          <Eyebrow>Daily score</Eyebrow>
          {month.days.map((day) => (
            <div key={day.d} className={styles.scoreCell}>
              <div
                className={styles.scoreBar}
                style={{ height: day.scoreHeight, background: day.scoreColor }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
