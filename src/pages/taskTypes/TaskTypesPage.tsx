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
import { APP_NAME } from '../../lib/brand'
import { useTaskTypes } from '../../taskTypes/context'
import { DashboardLayout } from '../dashboard/DashboardLayout'
import styles from './TaskTypesPage.module.css'

const FIRST_ICON: IconName = PICKABLE_ICONS[0]

export function TaskTypesPage() {
  const { defaults, custom, remaining, addCustom, removeCustom } = useTaskTypes()

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<IconName>(FIRST_ICON)
  const [error, setError] = useState<string | null>(null)

  const used = custom.length
  const full = remaining <= 0
  // Preview shows the colour the type would actually be given.
  const nextColor = CUSTOM_COLORS[used % CUSTOM_COLORS.length]

  const reset = () => {
    setCreating(false)
    setName('')
    setIcon(FIRST_ICON)
    setError(null)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = addCustom(name, icon)
    if (result.ok) reset()
    else setError(result.reason)
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
                <Button type="submit" size="md">
                  Create type
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
            <Button size="md" disabled={full} onClick={() => setCreating(true)}>
              <Icon name="plus" size={16} />
              New task type
            </Button>
          ) : null}
        </div>

        {custom.length ? (
          <div className={styles.grid}>
            {custom.map((type) => (
              <TaskTypeCard
                key={type.id}
                label={type.label}
                icon={type.icon}
                color={type.color}
                meta="Yours"
                onRemove={() => removeCustom(type.id)}
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
