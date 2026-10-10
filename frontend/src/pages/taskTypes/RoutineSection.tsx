import { useState } from 'react'
import { Button, GlassCard, Icon, IconButton, IconTile, SectionHeading } from '../../components'
import { ROUTINES_MAX, scheduleText } from '../../data/routines'
import { useDreams } from '../../dreams/context'
import { useGrowth } from '../../growth/context'
import { useRoutines } from '../../routines/context'
import { useSavings } from '../../savings/context'
import { useTaskTypes } from '../../taskTypes/context'
import { RoutineModal, type GoalGroup } from './RoutineModal'
import styles from './RoutineSection.module.css'

/**
 * "My usual day": the tasks that fill themselves in. Lives on the task types
 * page because every routine is filed under one of these types.
 */
export function RoutineSection() {
  const { all: types } = useTaskTypes()
  const { routines, loading, error, reload, add, update, remove } = useRoutines()
  const { pursuits: savings } = useSavings()
  const { pursuits: growth } = useGrowth()
  const { pursuits: dreams } = useDreams()
  const goalGroups: GoalGroup[] = [
    { label: 'Savings & investing', money: true, goals: savings },
    { label: 'Self-improvement', money: false, goals: growth },
    { label: 'Dreams', money: false, goals: dreams },
  ]

  const [creating, setCreating] = useState(false)
  // Held by id, so the modal reads the routine as it is now.
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = editingId ? routines.find((r) => r.id === editingId) : undefined
  // The routine whose delete is in flight, so a second click cannot send another.
  const [removing, setRemoving] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const full = routines.length >= ROUTINES_MAX
  const ready = !loading && !error
  const typeOf = (id: string) => types.find((type) => type.id === id)
  const goalOf = (id?: string) =>
    id ? [...savings, ...growth, ...dreams].find((goal) => goal.id === id) : undefined

  const closeModal = () => {
    setCreating(false)
    setEditingId(null)
  }

  const drop = async (id: string, label: string) => {
    if (removing) return
    if (!window.confirm(`Stop repeating "${label}"? Days already logged keep it.`)) return
    setRemoving(id)
    setRemoveError(null)
    const result = await remove(id)
    setRemoving(null)
    if (!result.ok) setRemoveError(result.reason)
  }

  return (
    <div className={styles.section}>
      <div className={styles.head}>
        <SectionHeading
          title="Routine"
          subtitle="Tasks that fill themselves in. Each one shows up unticked on the days it runs — so a day you skip is a gap in the grid, not a blank."
        />
        <Button size="md" disabled={!ready || full} onClick={() => setCreating(true)}>
          <Icon name="plus" size={16} />
          New recurring task
        </Button>
      </div>

      {removeError ? (
        <span className={styles.error} role="alert">
          {removeError}
        </span>
      ) : null}

      {/* A load that is running or failed must not pass for an empty routine. */}
      {loading ? (
        <GlassCard tone="b" className={styles.empty}>
          <span className={styles.emptyText}>Loading your routine…</span>
        </GlassCard>
      ) : error ? (
        <GlassCard tone="b" className={styles.empty}>
          <span className={styles.error} role="alert">
            Couldn't load your routine. {error}
          </span>
          <Button size="sm" onClick={reload}>
            Try again
          </Button>
        </GlassCard>
      ) : routines.length ? (
        <GlassCard padding="8px 10px">
          <ul className={styles.list}>
            {routines.map((routine) => {
              const type = typeOf(routine.typeId)
              const goal = goalOf(routine.pursuitId)
              return (
                <li key={routine.id} className={styles.row}>
                  <IconTile
                    icon={type?.icon ?? 'cube'}
                    size={36}
                    radius={10}
                    tone="raised"
                    color={type?.color ?? 'var(--text-muted)'}
                  />
                  <div className={styles.text}>
                    <span className={styles.label}>{routine.label}</span>
                    <span className={styles.meta}>
                      <Icon name="repeat" size={12} />
                      {scheduleText(routine)}
                      {type ? ` · ${type.label}` : null}
                      {goal ? ` · counts toward ${goal.name}` : null}
                    </span>
                  </div>
                  <div className={styles.rowActions}>
                    <IconButton
                      icon="pencil"
                      label={`Edit ${routine.label}`}
                      size={16}
                      disabled={removing === routine.id}
                      onClick={() => setEditingId(routine.id)}
                    />
                    <IconButton
                      icon="trash"
                      label={`Stop repeating ${routine.label}`}
                      size={16}
                      disabled={removing === routine.id}
                      onClick={() => void drop(routine.id, routine.label)}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </GlassCard>
      ) : (
        <GlassCard tone="b" className={styles.empty}>
          <IconTile icon="repeat" size={44} radius={14} tone="raised" color="var(--text-muted)" />
          <span className={styles.emptyText}>
            Nothing repeats yet. Set up the tasks you do most days — reading, the gym on Mon/Wed/Fri,
            rent on the 1st — and each morning starts with them already on the list.
          </span>
          <Button size="sm" onClick={() => setCreating(true)}>
            Set up your routine
          </Button>
        </GlassCard>
      )}

      <RoutineModal
        open={creating || editing !== undefined}
        editing={editing}
        types={types}
        goalGroups={goalGroups}
        onClose={closeModal}
        onSubmit={editing ? (form) => update(editing.id, form) : add}
      />
    </div>
  )
}
