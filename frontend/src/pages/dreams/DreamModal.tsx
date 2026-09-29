import { useState, type FormEvent } from 'react'
import { Button, Icon, IconPicker, Input, Modal, type IconName } from '../../components'
import { DREAM_ICONS } from '../../data/dreams'
import {
  DEFAULT_TARGET_MONTHS,
  PURSUIT_NAME_MAX,
  safeImageUrl,
  type Pursuit,
} from '../../data/pursuits'
import { daysBetween, mediumDate, parseDateInput, toDateInput } from '../../lib/date'
import type { NewPursuit, Result } from '../../pursuits/context'
import styles from './DreamModal.module.css'

export interface DreamModalProps {
  open: boolean
  /** The dream being edited. Absent, the modal creates a new one. */
  editing?: Pursuit
  onClose: () => void
  onSubmit: (dream: NewPursuit) => Promise<Result>
}

/** Dreams sit further out than a savings goal, so they start a year ahead. */
const DREAM_TARGET_MONTHS = DEFAULT_TARGET_MONTHS * 2

function defaultTarget(from: Date): string {
  const d = new Date(from)
  d.setMonth(d.getMonth() + DREAM_TARGET_MONTHS)
  return toDateInput(d)
}

/**
 * The fields. Mounted only while the dialog is open, so every open starts from
 * the dream being edited, or blank with today's date — no reset effect needed.
 */
function DreamForm({ editing, onClose, onSubmit }: Omit<DreamModalProps, 'open'>) {
  const [name, setName] = useState(editing?.name ?? '')
  const [icon, setIcon] = useState<IconName>(editing?.icon ?? DREAM_ICONS[0])
  const [image, setImage] = useState(editing?.image ?? '')
  const [createdAt, setCreatedAt] = useState(() => editing?.createdAt ?? toDateInput(new Date()))
  const [targetAt, setTargetAt] = useState(() => editing?.targetAt ?? defaultTarget(new Date()))
  const [error, setError] = useState<string | null>(null)
  // A write in flight — a second press would send it twice.
  const [saving, setSaving] = useState(false)
  const [brokenImage, setBrokenImage] = useState(false)

  const start = parseDateInput(createdAt)
  const target = parseDateInput(targetAt)
  const span = start && target ? daysBetween(start, target) : null

  const typedImage = image.trim()
  const safe = typedImage ? safeImageUrl(typedImage) : null
  const showPreview = Boolean(safe) && !brokenImage

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    const result = await onSubmit({ name, icon, image, createdAt, targetAt })
    setSaving(false)
    if (result.ok) onClose()
    else setError(result.reason)
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Input
        label="Name"
        value={name}
        maxLength={PURSUIT_NAME_MAX}
        placeholder="e.g. House with a workshop"
        onChange={(e) => {
          setName(e.target.value)
          setError(null)
        }}
        trailing={`${name.length}/${PURSUIT_NAME_MAX}`}
      />

      <IconPicker icons={DREAM_ICONS} value={icon} onChange={setIcon} />

      <div className={styles.picture}>
        <Input
          label="Image address"
          type="url"
          inputMode="url"
          value={image}
          placeholder="https://…"
          onChange={(e) => {
            setImage(e.target.value)
            setBrokenImage(false)
            setError(null)
          }}
          trailing="Optional"
        />

        <div className={styles.pictureBody}>
          {showPreview ? (
            /* Rendered as an <img src> and nowhere else. See safeImageUrl. */
            <img
              className={styles.preview}
              src={safe ?? undefined}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setBrokenImage(true)}
            />
          ) : (
            <span className={styles.previewFallback}>
              <Icon name={icon} size={26} />
            </span>
          )}

          <span className={styles.pictureNote}>
            {!typedImage
              ? 'Paste a picture of it and the card leads with that. Leave it blank and the icon stands in.'
              : !safe
                ? 'Only https:// addresses are accepted.'
                : brokenImage
                  ? "That address didn't load. The icon will stand in until it does."
                  : 'Loaded. The image is only ever shown, never followed.'}
          </span>
        </div>
      </div>

      <div className={styles.dates}>
        <Input
          label="Started"
          type="date"
          value={createdAt}
          max={targetAt || undefined}
          onChange={(e) => {
            setCreatedAt(e.target.value)
            setError(null)
          }}
          trailing="Today by default"
        />
        <Input
          label="Target"
          type="date"
          value={targetAt}
          min={createdAt || undefined}
          onChange={(e) => {
            setTargetAt(e.target.value)
            setError(null)
          }}
          trailing="When you want it done"
        />
      </div>

      {span !== null && target ? (
        <span className={styles.span}>
          {span > 0
            ? `${span} day${span === 1 ? '' : 's'} to run — finishing ${mediumDate(target)}.`
            : span === 0
              ? 'Starts and finishes the same day.'
              : 'The target date is before the start date.'}
        </span>
      ) : null}

      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}

      <div className={styles.actions}>
        <Button type="submit" size="md" disabled={saving}>
          {saving ? (editing ? 'Saving…' : 'Creating…') : editing ? 'Save changes' : 'Create dream'}
        </Button>
        <Button type="button" variant="subtle" size="md" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

/**
 * Create a dream, or edit one. Name, icon, an optional picture, and a date to
 * aim at. Keyed on the dream so moving from one edit to another starts fresh.
 */
export function DreamModal({ open, editing, onClose, onSubmit }: DreamModalProps) {
  return (
    <Modal
      open={open}
      title={editing ? `Edit ${editing.name}` : 'New dream'}
      subtitle={
        editing
          ? 'Clear the picture to go back to the icon. Steps stay as they are.'
          : 'Name it, pick something to stand for it, and give it a date. Steps come after.'
      }
      onClose={onClose}
    >
      <DreamForm key={editing?.id ?? 'new'} editing={editing} onClose={onClose} onSubmit={onSubmit} />
    </Modal>
  )
}
