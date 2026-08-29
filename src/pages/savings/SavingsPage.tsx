import { useMemo, useState } from 'react'
import {
  Button,
  GlassCard,
  Icon,
  IconTile,
  SectionHeading,
  SegmentedToggle,
  StatCard,
} from '../../components'
import { GOAL_KIND_META, GOAL_KINDS, type GoalKind } from '../../data/savings'
import { APP_NAME } from '../../lib/brand'
import { daysBetween, mediumDate, parseDateInput } from '../../lib/date'
import { useSavings } from '../../savings/context'
import { DashboardLayout } from '../dashboard/DashboardLayout'
import { GoalCard } from './GoalCard'
import { GoalModal } from './GoalModal'
import styles from './SavingsPage.module.css'

type Filter = 'all' | GoalKind

const FILTERS = [
  { value: 'all' as const, label: 'All' },
  ...GOAL_KINDS.map((kind) => ({ value: kind, label: `${GOAL_KIND_META[kind].label}s` })),
]

export function SavingsPage() {
  const { goals, addGoal, removeGoal, addStep, toggleStep, removeStep } = useSavings()

  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')

  const stats = useMemo(() => {
    const steps = goals.flatMap((g) => g.steps)
    const targets = goals
      .map((g) => parseDateInput(g.targetAt))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime())

    const now = new Date()
    const overdue = targets.filter((d) => daysBetween(now, d) < 0).length
    const next = targets.find((d) => daysBetween(now, d) >= 0)

    return {
      stepsDone: steps.filter((s) => s.done).length,
      stepsTotal: steps.length,
      overdue,
      next,
    }
  }, [goals])

  const shown = filter === 'all' ? goals : goals.filter((g) => g.kind === filter)
  const empty = goals.length === 0

  return (
    <DashboardLayout
      activeId="savings"
      trail={[APP_NAME, 'Savings & investing']}
      title="Savings & investing"
    >
      <div className={styles.pageHead}>
        <div className={styles.pageTitles}>
          <span className={styles.title}>Savings &amp; investing</span>
          <span className={styles.blurb}>
            Every saving, investment and dream in one place. Give each one a finish line, then
            break it into the steps that actually move it.
          </span>
        </div>
        {!empty ? (
          <Button size="md" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} />
            New goal
          </Button>
        ) : null}
      </div>

      {empty ? (
        /* ---- empty state ---- */
        <GlassCard tone="b" className={styles.empty} padding="52px 32px 44px">
          <span className={styles.emptyGlow} aria-hidden="true" />
          <div className={styles.emptyTiles} aria-hidden="true">
            {GOAL_KINDS.map((kind) => (
              <IconTile
                key={kind}
                icon={GOAL_KIND_META[kind].icon}
                size={52}
                radius={16}
                tone="raised"
                color={GOAL_KIND_META[kind].color}
              />
            ))}
          </div>

          <span className={styles.emptyTitle}>Nothing saved for yet</span>
          <span className={styles.emptyText}>
            Start with one thing you're putting money towards — a buffer, a first investment, or
            the trip you keep talking about. You can add steps to it once it exists.
          </span>

          <Button size="md" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} />
            Add your first goal
          </Button>

          <div className={styles.emptyKinds}>
            {GOAL_KINDS.map((kind) => {
              const meta = GOAL_KIND_META[kind]
              return (
                <div key={kind} className={styles.emptyKind}>
                  <span className={styles.emptyKindHead} style={{ color: meta.color }}>
                    <Icon name={meta.icon} size={16} />
                    {meta.label}
                  </span>
                  <span className={styles.emptyKindBlurb}>{meta.blurb}</span>
                </div>
              )
            })}
          </div>
        </GlassCard>
      ) : (
        <>
          <div className={styles.stats}>
            <StatCard label="Goals" value={String(goals.length)} icon="wallet" />
            <StatCard
              label="Steps done"
              value={`${stats.stepsDone}/${stats.stepsTotal}`}
              icon="checkmarkCircle"
            />
            <StatCard
              label="Next target"
              value={stats.next ? mediumDate(stats.next) : '—'}
              icon="clock"
            />
            <StatCard
              label="Overdue"
              value={String(stats.overdue)}
              delta={stats.overdue ? `-${stats.overdue}` : undefined}
              icon="target"
            />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <SectionHeading
                title="Your goals"
                subtitle={
                  filter === 'all'
                    ? `${goals.length} in total, newest first.`
                    : `${shown.length} of ${goals.length} shown.`
                }
              />
              <SegmentedToggle
                options={FILTERS}
                value={filter}
                onChange={setFilter}
                size="sm"
                label="Filter goals by type"
              />
            </div>

            {shown.length ? (
              <div className={styles.grid}>
                {shown.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onRemove={() => removeGoal(goal.id)}
                    onAddStep={(label) => addStep(goal.id, label)}
                    onToggleStep={(stepId) => toggleStep(goal.id, stepId)}
                    onRemoveStep={(stepId) => removeStep(goal.id, stepId)}
                  />
                ))}
              </div>
            ) : (
              <GlassCard tone="b" className={styles.filterEmpty}>
                <span className={styles.filterEmptyText}>
                  Nothing filed under {filter === 'all' ? 'that' : `${GOAL_KIND_META[filter].label}s`} yet.
                </span>
                <Button size="sm" variant="subtle" onClick={() => setFilter('all')}>
                  Show all goals
                </Button>
              </GlassCard>
            )}
          </div>
        </>
      )}

      <GoalModal open={creating} onClose={() => setCreating(false)} onCreate={addGoal} />
    </DashboardLayout>
  )
}
