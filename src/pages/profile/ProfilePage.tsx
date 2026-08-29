import { useState, type FormEvent } from 'react'
import {
  Badge,
  Button,
  Eyebrow,
  GlassCard,
  Icon,
  Input,
  NotificationCard,
  SectionHeading,
  SegmentedToggle,
  Switch,
} from '../../components'
import { REMINDER_GROUPS, cadenceSummary } from '../../data/reminders'
import { APP_NAME } from '../../lib/brand'
import { PASSWORD_MIN } from '../../profile/ProfileProvider'
import { useProfile } from '../../profile/context'
import { navigate } from '../../router'
import { useSavings } from '../../savings/context'
import { useSession } from '../../session/context'
import { useTaskTypes } from '../../taskTypes/context'
import { DashboardLayout } from '../dashboard/DashboardLayout'
import { ReminderRow } from './ReminderRow'
import styles from './ProfilePage.module.css'

type Tab = 'account' | 'notifications'

const TABS = [
  { value: 'account' as const, label: 'Account' },
  { value: 'notifications' as const, label: 'Notifications' },
]

/** "Nikola Vujic" becomes "NV". Three letters is a monogram, not a chip. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

type Note = { tone: 'ok' | 'bad'; text: string } | null

function AccountTab() {
  const { userName, signOut } = useSession()
  const { email, keepSignedIn, setKeepSignedIn, saveAccount, changePassword } = useProfile()

  const [name, setName] = useState(userName)
  const [address, setAddress] = useState(email)
  const [detailsNote, setDetailsNote] = useState<Note>(null)

  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passwordNote, setPasswordNote] = useState<Note>(null)

  const dirty = name !== userName || address !== email

  const submitDetails = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = saveAccount({ name, email: address })
    setDetailsNote(
      result.ok ? { tone: 'ok', text: 'Details saved.' } : { tone: 'bad', text: result.reason },
    )
  }

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = changePassword({ current, password, confirm })
    if (result.ok) {
      setCurrent('')
      setPassword('')
      setConfirm('')
      setPasswordNote({ tone: 'ok', text: 'Password updated.' })
    } else {
      setPasswordNote({ tone: 'bad', text: result.reason })
    }
  }

  return (
    <div className={styles.columns}>
      <GlassCard>
        <SectionHeading
          title="Your details"
          subtitle="The name Jarvis greets you with, and the address you sign in on."
        />
        <form className={styles.form} onSubmit={submitDetails}>
          <Input
            label="Name"
            name="name"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setDetailsNote(null)
            }}
          />
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Your email address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              setDetailsNote(null)
            }}
          />

          {detailsNote ? (
            <span
              className={detailsNote.tone === 'ok' ? styles.ok : styles.error}
              role={detailsNote.tone === 'bad' ? 'alert' : 'status'}
            >
              {detailsNote.text}
            </span>
          ) : null}

          <div className={styles.actions}>
            <Button type="submit" size="md" disabled={!dirty}>
              Save changes
            </Button>
            {dirty ? (
              <Button
                type="button"
                variant="subtle"
                size="md"
                onClick={() => {
                  setName(userName)
                  setAddress(email)
                  setDetailsNote(null)
                }}
              >
                Discard
              </Button>
            ) : null}
          </div>
        </form>
      </GlassCard>

      <div className={styles.stack}>
        <GlassCard>
          <SectionHeading
            title="Password"
            subtitle={`At least ${PASSWORD_MIN} characters, and not the one you have now.`}
          />
          <form className={styles.form} onSubmit={submitPassword}>
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              placeholder="Your current password"
              value={current}
              onChange={(e) => {
                setCurrent(e.target.value)
                setPasswordNote(null)
              }}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              placeholder="Your new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setPasswordNote(null)
              }}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              placeholder="Type it once more"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                setPasswordNote(null)
              }}
            />

            {passwordNote ? (
              <span
                className={passwordNote.tone === 'ok' ? styles.ok : styles.error}
                role={passwordNote.tone === 'bad' ? 'alert' : 'status'}
              >
                {passwordNote.text}
              </span>
            ) : null}

            <div className={styles.actions}>
              <Button type="submit" size="md">
                Update password
              </Button>
            </div>
          </form>
        </GlassCard>

        <GlassCard>
          <SectionHeading title="Sign-in" subtitle="How this browser treats your session." />
          <div className={styles.form}>
            <Switch
              checked={keepSignedIn}
              onChange={setKeepSignedIn}
              label="Keep me signed in on this device"
            />
            <div className={styles.actions}>
              <Button
                type="button"
                variant="subtle"
                size="md"
                onClick={() => {
                  signOut()
                  navigate('signin')
                }}
              >
                <Icon name="key" size={16} />
                Sign out
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const { reminders, updateReminder, paused, setPaused, channels, setChannel } = useProfile()

  const on = reminders.filter((r) => r.enabled)
  const preview = on[0] ?? null

  return (
    <div className={styles.notifications}>
      <GlassCard>
        <SectionHeading
          title="Delivery"
          subtitle="Where reminders land, and a master switch for when you want quiet."
          action={<Badge>{on.length} on</Badge>}
        />

        <div className={styles.delivery}>
          <div className={styles.switches}>
            <Switch
              checked={!paused}
              onChange={(live) => setPaused(!live)}
              label={paused ? 'All reminders paused' : 'Reminders are on'}
            />
            <Switch
              checked={channels.push}
              onChange={(v) => setChannel('push', v)}
              label="Push notifications"
            />
            <Switch
              checked={channels.email}
              onChange={(v) => setChannel('email', v)}
              label="Email"
            />
          </div>

          <div className={styles.preview}>
            <Eyebrow>Preview</Eyebrow>
            {preview ? (
              <NotificationCard
                icon={preview.icon}
                title={preview.title}
                body={preview.body}
                meta={cadenceSummary(preview)}
                color={preview.color}
                live={!paused}
                muted={paused}
              />
            ) : (
              <NotificationCard
                icon="bell"
                title="Nothing scheduled"
                body="Turn a reminder on below and it will show up here as it would arrive."
                color="var(--text-muted)"
                muted
              />
            )}
          </div>
        </div>
      </GlassCard>

      {REMINDER_GROUPS.map((group) => {
        const rows = reminders.filter((r) => r.group === group.id)
        if (!rows.length) return null
        return (
          <div key={group.id} className={styles.group}>
            <SectionHeading title={group.label} subtitle={group.blurb} />
            <div className={styles.rows}>
              {rows.map((reminder) => (
                <ReminderRow
                  key={reminder.id}
                  reminder={reminder}
                  paused={paused}
                  onChange={(patch) => updateReminder(reminder.id, patch)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ProfilePage() {
  const { userName } = useSession()
  const { email, reminders } = useProfile()
  const { goals } = useSavings()
  const { all: types } = useTaskTypes()

  const [tab, setTab] = useState<Tab>('account')
  const remindersOn = reminders.filter((r) => r.enabled).length

  return (
    <DashboardLayout activeId="profile" trail={[APP_NAME, 'Profile']} title="Profile">
      <div className={styles.pageTitles}>
        <span className={styles.title}>Profile</span>
        <span className={styles.blurb}>
          Your account details, and every reminder {APP_NAME} can send you. Turn them on one at a
          time — nothing goes out unless you ask for it.
        </span>
      </div>

      <GlassCard className={styles.identity} padding="24px 26px">
        <span className={styles.avatar} aria-hidden="true">
          {initials(userName)}
        </span>
        <div className={styles.identityText}>
          <span className={styles.identityName}>{userName}</span>
          <span className={styles.identityEmail}>
            <Icon name="person" size={13} />
            {email}
          </span>
        </div>
        <div className={styles.chips}>
          <span className={styles.chip}>
            <Icon name="wallet" size={14} />
            {goals.length} goal{goals.length === 1 ? '' : 's'}
          </span>
          <span className={styles.chip}>
            <Icon name="cube" size={14} />
            {types.length} task types
          </span>
          <span className={styles.chip}>
            <Icon name="bell" size={14} />
            {remindersOn} reminder{remindersOn === 1 ? '' : 's'} on
          </span>
        </div>
      </GlassCard>

      <SegmentedToggle
        options={TABS}
        value={tab}
        onChange={setTab}
        size="md"
        label="Profile sections"
        style={{ alignSelf: 'flex-start' }}
      />

      {tab === 'account' ? <AccountTab /> : <NotificationsTab />}
    </DashboardLayout>
  )
}
