import { useMemo, useState } from 'react'
import {
  Button,
  GlassCard,
  Icon,
  IconTile,
  SectionHeading,
  StatCard,
} from '../../components'
import { DREAM_EXAMPLES } from '../../data/dreams'
import { useDreams } from '../../dreams/context'
import { APP_NAME } from '../../lib/brand'
import { daysBetween, mediumDate, parseDateInput } from '../../lib/date'
import { DashboardLayout } from '../dashboard/DashboardLayout'
import { DreamCard } from './DreamCard'
import { DreamModal } from './DreamModal'
import styles from './DreamsPage.module.css'

/**
 * Big goals and dreams. Same skeleton as the pursuit pages — header, stats,
 * grid, modal, empty screen — but there are no kinds to filter by, so the
 * filter strip is gone and the cards lead with a picture instead of a tint.
 */
export function DreamsPage() {
  const { pursuits: dreams, add, remove, addStep, toggleStep, removeStep } = useDreams()
  const [creating, setCreating] = useState(false)

  const stats = useMemo(() => {
    const steps = dreams.flatMap((d) => d.steps)
    const targets = dreams
      .map((d) => parseDateInput(d.targetAt))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime())

    const now = new Date()
    return {
      stepsDone: steps.filter((s) => s.done).length,
      stepsTotal: steps.length,
      pictured: dreams.filter((d) => d.image).length,
      next: targets.find((d) => daysBetween(now, d) >= 0),
    }
  }, [dreams])

  const empty = dreams.length === 0

  return (
    <DashboardLayout
      activeId="goals"
      trail={[APP_NAME, 'Big goals & dreams']}
    >
      <div className={styles.pageHead}>
        <div className={styles.pageTitles}>
          <span className={styles.title}>Big goals &amp; dreams</span>
          <span className={styles.blurb}>
            The far-off ones. No categories here — just what it is, a picture of it if you have
            one, and the steps between you and it.
          </span>
        </div>
        {!empty ? (
          <Button size="md" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} />
            New dream
          </Button>
        ) : null}
      </div>

      {empty ? (
        /* ---- empty state ---- */
        <GlassCard tone="b" className={styles.empty} padding="52px 32px 44px">
          <span className={styles.emptyGlow} aria-hidden="true" />
          <div className={styles.emptyTiles} aria-hidden="true">
            {DREAM_EXAMPLES.map((example) => (
              <IconTile
                key={example.label}
                icon={example.icon}
                size={52}
                radius={16}
                tone="raised"
                color={example.color}
              />
            ))}
          </div>

          <span className={styles.emptyTitle}>Nothing on the horizon yet</span>
          <span className={styles.emptyText}>
            Write down the one you would not say out loud at work. Give it a name, a picture and a
            date, and it stops being a mood and starts being a list.
          </span>

          <Button size="md" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} />
            Add your first dream
          </Button>

          <div className={styles.emptyKinds}>
            {DREAM_EXAMPLES.map((example) => (
              <div key={example.label} className={styles.emptyKind}>
                <span className={styles.emptyKindHead} style={{ color: example.color }}>
                  <Icon name={example.icon} size={16} />
                  {example.label}
                </span>
                <span className={styles.emptyKindBlurb}>{example.blurb}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : (
        <>
          <div className={styles.stats}>
            <StatCard label="Dreams" value={String(dreams.length)} icon="star" />
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
              label="With a picture"
              value={`${stats.pictured}/${dreams.length}`}
              icon="bulb"
            />
          </div>

          <div className={styles.section}>
            <SectionHeading
              title="Your dreams"
              subtitle={`${dreams.length} in total, newest first.`}
            />
            <div className={styles.grid}>
              {dreams.map((dream) => (
                <DreamCard
                  key={dream.id}
                  dream={dream}
                  onRemove={() => remove(dream.id)}
                  onAddStep={(label) => addStep(dream.id, label)}
                  onToggleStep={(stepId) => toggleStep(dream.id, stepId)}
                  onRemoveStep={(stepId) => removeStep(dream.id, stepId)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <DreamModal open={creating} onClose={() => setCreating(false)} onCreate={add} />
    </DashboardLayout>
  )
}
