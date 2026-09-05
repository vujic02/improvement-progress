import { useMemo } from 'react'
import { Button, Eyebrow, Icon, ProgressBar } from '../../components'
import { TODAY_TASKS } from '../../data/tasks'
import { ASSISTANT_NAME } from '../../lib/brand'
import { bootStamp, salutation } from '../../lib/date'
import { seeded } from '../../lib/seeded'
import { navigate, type Route } from '../../router'
import { useSession } from '../../session/context'
import { useTypedGreeting } from './useTypedGreeting'
import styles from './WelcomePage.module.css'

const BAR_COUNT = 28

export interface WelcomePageProps {
  /**
   * `welcome` is the cold-boot greeting before sign-in; `boot` is the shorter
   * hand-off played after credentials are accepted.
   */
  variant: 'welcome' | 'boot'
  /** Route to enter once the greeting finishes. */
  next: Route
  typingSpeed?: number
  voice?: boolean
}

/** Jarvis loading screen — waveform, typed greeting, progress, then hand-off. */
export function WelcomePage({ variant, next, typingSpeed = 55, voice = true }: WelcomePageProps) {
  const { userName } = useSession()
  const now = useMemo(() => new Date(), [])

  // Seeded so every bar keeps its own rhythm across re-renders.
  const bars = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, i) => ({
        duration: Math.round(620 + seeded(i, 3) * 900),
        delay: Math.round(seeded(i, 9) * 800),
      })),
    [],
  )

  const openCount = TODAY_TASKS.filter((t) => !t.done).length
  const headline = `${salutation(now)}, ${userName}.`
  const subline =
    variant === 'boot'
      ? 'Your month is loaded. What are we building today?'
      : `${openCount} tasks still open today. What are we building today?`

  const typed = useTypedGreeting({
    headline,
    subline,
    speed: typingSpeed,
    voice,
    holdMs: variant === 'boot' ? 1100 : 1400,
    onFinished: () => navigate(next),
  })

  const status = typed.voiceBlocked
    ? `Tap anywhere to hear ${ASSISTANT_NAME}`
    : typed.done
      ? variant === 'boot'
        ? 'Opening your dashboard'
        : 'Awaiting sign-in'
      : 'Bringing systems up'

  return (
    <div className={styles.screen}>
      <div className={styles.glow} />
      <div className={styles.vignette} />
      <div className={styles.ring} />

      <div className={styles.skip}>
        <Button variant="subtle" size="sm" onClick={() => navigate(next)}>
          Skip
        </Button>
      </div>

      <div className={styles.content}>
        <Eyebrow color="var(--accent)">
          {variant === 'boot' ? 'Loading your month' : 'System online'}
        </Eyebrow>

        <div className={styles.bars} aria-hidden="true">
          {bars.map((bar, i) => (
            <span
              key={i}
              className={styles.bar}
              style={{ animationDuration: `${bar.duration}ms`, animationDelay: `${bar.delay}ms` }}
            />
          ))}
        </div>

        <div className={styles.lines} aria-live="polite">
          <div className={styles.headline}>
            {typed.headline}
            <span className={styles.caret} aria-hidden="true" />
          </div>
          <div className={styles.subline}>{typed.subline}</div>
        </div>

        <div className={styles.progress}>
          <div className={styles.progressTrack}>
            <ProgressBar
              value={typed.progress}
              height={4}
              color="linear-gradient(90deg, var(--accent) 0%, var(--accent-cyan) 100%)"
              trackColor="rgba(255,255,255,.10)"
              label="Startup progress"
            />
          </div>
          <span className={styles.status}>{status}</span>

          {typed.voiceBlocked ? (
            <button type="button" className={styles.voiceButton} onClick={typed.enableVoice}>
              <Icon name="bell" size={14} />
              Enable voice
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.stamp}>
        <Eyebrow color="var(--text-faint)">{bootStamp(now)}</Eyebrow>
      </div>
    </div>
  )
}
