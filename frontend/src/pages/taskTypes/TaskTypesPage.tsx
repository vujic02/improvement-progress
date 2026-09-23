import { useState, type FormEvent } from 'react'
import {
  Badge,
  Button,
  Eyebrow,
  GlassCard,
  Icon,
  IconPicker,
  IconTile,
  Input,
  ProgressBar,
  SectionHeading,
  TaskTypeCard,
  type IconName,
} from '../../components'
import {
  CUSTOM_COLORS,
  CUSTOM_TASK_TYPE_LIMIT,
  PICKABLE_ICONS,
  TASK_TYPE_NAME_MAX,
} from '../../data/taskTypes'
import { useDays } from '../../days/context'
import { APP_NAME } from '../../lib/brand'
import { useTaskTypes } from '../../taskTypes/context'
import { DashboardLayout } from '../dashboard/DashboardLayout'
import styles from './TaskTypesPage.module.css'

const FIRST_ICON: IconName = PICKABLE_ICONS[0]

export function TaskTypesPage() {
  const {
    defaults,
    custom,
    remaining,
    loading,
    error: loadError,
    reload,
    addCustom,
    removeCustom,
  } = useTaskTypes()
  // Deleting a type deletes its tasks server-side, so today's list is stale after.
  const { reload: reloadDays } = useDays()

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<IconName>(FIRST_ICON)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // The type whose delete is in flight, so a second click cannot send another.
  const [removing, setRemoving] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const used = custom.length
  const full = remaining <= 0
  // Until the list has loaded, the local checks in addCustom have nothing to check against.
  const ready = !loading && !loadError
  // Preview shows the colour the type would actually be given.
  const nextColor = CUSTOM_COLORS[used % CUSTOM_COLORS.length]

  const reset = () => {
    setCreating(false)
    setName('')
    setIcon(FIRST_ICON)
    setError(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    const result = await addCustom(name, icon)
    setSaving(false)
    if (result.ok) reset()
    else setError(result.reason)
  }

  const remove = async (id: string, label: string) => {
    if (removing) return
    // Its tasks go with it, and past days are scored on those, so this one asks.
    if (!window.confirm(`Delete "${label}"? Every task logged against it goes too.`)) return

    setRemoving(id)
    setRemoveError(null)
    const result = await removeCustom(id)
    setRemoving(null)
    if (result.ok) reloadDays()
    else setRemoveError(result.reason)
  }

  return (
    <DashboardLayout activeId="types" trail={[APP_NAME, 'Task types']}>
      <div className={styles.pageHead}>
        <div className={styles.pageTitles}>
          <span className={styles.title}>Task types</span>
          <span className={styles.blurb}>
            Task types are the categories your days get scored against. {defaults.length} come
            built in; add up to {CUSTOM_TASK_TYPE_LIMIT} of your own and they show up in the habit
            grid straight away.
          </span>
        </div>

        <div className={styles.allowance}>
          <div className={styles.allowanceHead}>
            <Eyebrow>Your types</Eyebrow>
            <span className={styles.allowanceCount}>
              {used} / {CUSTOM_TASK_TYPE_LIMIT}
            </span>
          </div>
          <ProgressBar
            value={(used / CUSTOM_TASK_TYPE_LIMIT) * 100}
            color={full ? 'var(--accent-orange)' : 'var(--accent)'}
            label="Custom task types used"
          />
        </div>
      </div>

      {/* ---- create ---- */}
      {creating ? (
        <GlassCard>
          <SectionHeading
            title="New task type"
            subtitle="Pick an icon and give it a name. You can remove it again at any time."
          />
          <form className={styles.form} onSubmit={submit} style={{ marginTop: 22 }}>
            <IconPicker icons={PICKABLE_ICONS} value={icon} onChange={setIcon} />

            <div className={styles.formColumn}>
              <Input
                label="Name"
                value={name}
                maxLength={TASK_TYPE_NAME_MAX}
                placeholder="e.g. Language practice"
                autoFocus
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                trailing={`${name.length}/${TASK_TYPE_NAME_MAX}`}
              />

              <div className={styles.preview}>
                <IconTile icon={icon} size={42} radius={12} tone="raised" color={nextColor} />
                <div className={styles.previewText}>
                  <Eyebrow>Preview</Eyebrow>
                  <span
                    className={[
                      styles.previewName,
                      name.trim() ? '' : styles.previewPlaceholder,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {name.trim() || 'Your task type'}
                  </span>
                </div>
              </div>

              {error ? (
                <span className={styles.error} role="alert">
                  {error}
                </span>
              ) : null}

              <div className={styles.actions}>
                <Button type="submit" size="md" disabled={saving}>
                  {saving ? 'Creating…' : 'Create type'}
                </Button>
                <Button type="button" variant="subtle" size="md" onClick={reset}>
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </GlassCard>
      ) : null}

      {/* ---- your types ---- */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <SectionHeading
            title="Your types"
            subtitle={
              full
                ? `You've used all ${CUSTOM_TASK_TYPE_LIMIT} slots. Remove one to make room.`
                : `${remaining} of ${CUSTOM_TASK_TYPE_LIMIT} slots left`
            }
          />
          {!creating ? (
            <Button size="md" disabled={full || !ready} onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} />
              New task type
            </Button>
          ) : null}
        </div>

        {removeError ? (
          <span className={styles.error} role="alert">
            {removeError}
          </span>
        ) : null}

        {/* A load that is running or failed must not pass for an empty list. */}
        {loading ? (
          <GlassCard tone="b" className={styles.empty}>
            <span className={styles.emptyText}>Loading your types…</span>
          </GlassCard>
        ) : loadError ? (
          <GlassCard tone="b" className={styles.empty}>
            <span className={styles.error} role="alert">
              Couldn't load your types. {loadError}
            </span>
            <Button size="sm" onClick={reload}>
              Try again
            </Button>
          </GlassCard>
        ) : custom.length ? (
          <div className={styles.grid}>
            {custom.map((type) => (
              <TaskTypeCard
                key={type.id}
                label={type.label}
                icon={type.icon}
                color={type.color}
                meta="Yours"
                onRemove={() => remove(type.id, type.label)}
              />
            ))}
          </div>
        ) : (
          <GlassCard tone="b" className={styles.empty}>
            <IconTile icon="plus" size={44} radius={14} tone="raised" color="var(--text-muted)" />
            <span className={styles.emptyText}>
              Nothing of your own yet. Add a type for anything the defaults don't cover — a
              language, a side project, a habit you're building.
            </span>
            <Button size="sm" disabled={full} onClick={() => setCreating(true)}>
              Create your first type
            </Button>
          </GlassCard>
        )}
      </div>

      {/* ---- defaults ---- */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <SectionHeading
            title="Defaults"
            subtitle="Built in, and always available. These cannot be removed."
          />
          <Badge>{defaults.length} types</Badge>
        </div>
        <div className={styles.grid}>
          {defaults.map((type) => (
            <TaskTypeCard
              key={type.id}
              label={type.label}
              icon={type.icon}
              color={type.color}
              meta="Default"
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
