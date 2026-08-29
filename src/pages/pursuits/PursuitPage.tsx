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
import { formatMoney, kindMeta, type PursuitArea } from '../../data/pursuits'
import { APP_NAME } from '../../lib/brand'
import { daysBetween, mediumDate, parseDateInput } from '../../lib/date'
import { usePursuitStore, type PursuitContext } from '../../pursuits/context'
import { DashboardLayout } from '../dashboard/DashboardLayout'
import { PursuitCard } from './PursuitCard'
import { PursuitModal } from './PursuitModal'
import styles from './PursuitPage.module.css'

/**
 * The empty screen introduces the first three kinds and no more. An area with
 * nine of them would turn its own welcome into a menu.
 */
const EMPTY_KINDS_SHOWN = 3

export interface PursuitPageProps {
  area: PursuitArea
  context: PursuitContext
  hookName: string
}

/**
 * The page both pursuit areas render: header, stats, kind filter, card grid and
 * the create modal — or a dedicated empty screen when there is nothing yet.
 * Everything that differs between money and growth comes in through `area`.
 */
export function PursuitPage({ area, context, hookName }: PursuitPageProps) {
  const { pursuits, add, remove, addStep, toggleStep, removeStep, contribute } = usePursuitStore(
    context,
    hookName,
  )

  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  const filters = useMemo(
    () => [
      { value: 'all', label: 'All' },
      ...area.kinds.map((kind) => ({ value: kind, label: kindMeta(area, kind).plural })),
    ],
    [area],
  )

  const stats = useMemo(() => {
    const steps = pursuits.flatMap((p) => p.steps)
    const targets = pursuits
      .map((p) => parseDateInput(p.targetAt))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime())

    const now = new Date()
    return {
      stepsDone: steps.filter((s) => s.done).length,
      stepsTotal: steps.length,
      overdue: targets.filter((d) => daysBetween(now, d) < 0).length,
      next: targets.find((d) => daysBetween(now, d) >= 0),
    }
  }, [pursuits])

  /** Money areas get one card per kind: what has gone in, against the target. */
  const money = useMemo(
    () =>
      area.kinds.map((kind) => {
        const meta = kindMeta(area, kind)
        const mine = pursuits.filter((p) => p.kind === kind)
        const saved = mine.reduce((sum, p) => sum + (p.saved ?? 0), 0)
        const goal = mine.reduce((sum, p) => sum + (p.target ?? 0), 0)
        return {
          kind,
          meta,
          saved,
          pct: goal > 0 ? `${Math.round((saved / goal) * 100)}%` : undefined,
        }
      }),
    [area, pursuits],
  )

  const shown = filter === 'all' ? pursuits : pursuits.filter((p) => p.kind === filter)
  const empty = pursuits.length === 0

  return (
    <DashboardLayout activeId={area.navId} trail={[APP_NAME, area.title]} title={area.title}>
      <div className={styles.pageHead}>
        <div className={styles.pageTitles}>
          <span className={styles.title}>{area.title}</span>
          <span className={styles.blurb}>{area.blurb}</span>
        </div>
        {!empty ? (
          <Button size="md" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} />
            {area.newLabel}
          </Button>
        ) : null}
      </div>

      {empty ? (
        /* ---- empty state ---- */
        <GlassCard tone="b" className={styles.empty} padding="52px 32px 44px">
          <span className={styles.emptyGlow} aria-hidden="true" />
          <div className={styles.emptyTiles} aria-hidden="true">
            {area.kinds.slice(0, EMPTY_KINDS_SHOWN).map((kind) => (
              <IconTile
                key={kind}
                icon={kindMeta(area, kind).icon}
                size={52}
                radius={16}
                tone="raised"
                color={kindMeta(area, kind).color}
              />
            ))}
          </div>

          <span className={styles.emptyTitle}>{area.emptyTitle}</span>
          <span className={styles.emptyText}>{area.emptyText}</span>

          <Button size="md" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} />
            {area.emptyCta}
          </Button>

          <div className={styles.emptyKinds}>
            {area.kinds.slice(0, EMPTY_KINDS_SHOWN).map((kind) => {
              const meta = kindMeta(area, kind)
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
            {area.money
              ? money.map((row) => (
                  <StatCard
                    key={row.kind}
                    label={row.meta.statLabel ?? row.meta.label}
                    value={formatMoney(row.saved)}
                    delta={row.pct}
                    /* Bills are money out — a bigger number is not a gain. */
                    deltaTone={row.meta.spend ? 'neutral' : undefined}
                    icon={row.meta.icon}
                  />
                ))
              : [
                  <StatCard key="goals" label="Goals" value={String(pursuits.length)} icon="target" />,
                  <StatCard
                    key="steps"
                    label="Steps done"
                    value={`${stats.stepsDone}/${stats.stepsTotal}`}
                    icon="checkmarkCircle"
                  />,
                  <StatCard
                    key="next"
                    label="Next target"
                    value={stats.next ? mediumDate(stats.next) : '—'}
                    icon="clock"
                  />,
                  <StatCard
                    key="overdue"
                    label="Overdue"
                    value={String(stats.overdue)}
                    delta={stats.overdue ? `-${stats.overdue}` : undefined}
                    icon="flame"
                  />,
                ]}
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHead}>
              <SectionHeading
                title="Your goals"
                subtitle={
                  filter === 'all'
                    ? `${pursuits.length} in total, newest first.`
                    : `${shown.length} of ${pursuits.length} shown.`
                }
              />
              <SegmentedToggle
                options={filters}
                value={filter}
                onChange={setFilter}
                size="sm"
                label="Filter goals by type"
              />
            </div>

            {shown.length ? (
              <div className={styles.grid}>
                {shown.map((pursuit) => (
                  <PursuitCard
                    key={pursuit.id}
                    pursuit={pursuit}
                    area={area}
                    onRemove={() => remove(pursuit.id)}
                    onContribute={
                      area.money ? (value) => contribute(pursuit.id, value) : undefined
                    }
                    onAddStep={(label) => addStep(pursuit.id, label)}
                    onToggleStep={(stepId) => toggleStep(pursuit.id, stepId)}
                    onRemoveStep={(stepId) => removeStep(pursuit.id, stepId)}
                  />
                ))}
              </div>
            ) : (
              <GlassCard tone="b" className={styles.filterEmpty}>
                <span className={styles.filterEmptyText}>
                  Nothing filed under {kindMeta(area, filter).plural} yet.
                </span>
                <Button size="sm" variant="subtle" onClick={() => setFilter('all')}>
                  Show all goals
                </Button>
              </GlassCard>
            )}
          </div>
        </>
      )}

      <PursuitModal
        open={creating}
        area={area}
        onClose={() => setCreating(false)}
        onCreate={add}
      />
    </DashboardLayout>
  )
}
