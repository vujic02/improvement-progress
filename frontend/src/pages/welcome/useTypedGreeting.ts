import { useCallback, useEffect, useRef, useState } from 'react'
import { onFirstGesture, speak, type SpeechOutcome } from '../../lib/speech'

/** Ceiling on waiting for a speech engine that never reports back. */
const MAX_SPEECH_WAIT = 20000
/** How long to sit on a blocked greeting before giving up on the gesture. */
const BLOCKED_HOLD = 8000

export interface TypedGreetingOptions {
  headline: string
  subline: string
  /** ms per character of the headline. The subline types ~3x faster. */
  speed?: number
  /** Read the greeting aloud when the browser has speech synthesis. */
  voice?: boolean
  /** Fires once, after both the typing and the speech have finished. */
  onFinished?: () => void
  holdMs?: number
}

export interface TypedGreeting {
  headline: string
  subline: string
  /** Typing has reached the end of both lines. */
  done: boolean
  /** 0–100 across both lines. */
  progress: number
  /** The browser refused to speak until the user interacts with the page. */
  voiceBlocked: boolean
  /** Retry speech — call from a real click so the browser grants activation. */
  enableVoice: () => void
}

interface TypedState {
  head: string
  sub: string
  done: boolean
}

/** Outcome is tagged with its attempt so a retry resets it without setState-in-effect. */
interface SpeechState {
  attempt: number
  outcome: SpeechOutcome
}

const EMPTY: TypedState = { head: '', sub: '', done: false }

/**
 * Types the two greeting lines out character by character, speaks them, and
 * calls `onFinished` once both have finished — the typing alone used to win the
 * race and unmount the screen mid-sentence.
 *
 * Every timer writes the whole state object, so a restart (changed lines or
 * speed) clears the previous run on its first tick without touching state from
 * the effect body.
 */
export function useTypedGreeting({
  headline,
  subline,
  speed = 55,
  voice = true,
  onFinished,
  holdMs = 1400,
}: TypedGreetingOptions): TypedGreeting {
  const [typed, setTyped] = useState<TypedState>(EMPTY)
  const [attempt, setAttempt] = useState(0)
  const [speech, setSpeech] = useState<SpeechState | null>(null)

  // Kept in a ref so a re-created callback never restarts the animation.
  const finishedRef = useRef(onFinished)
  useEffect(() => {
    finishedRef.current = onFinished
  })

  // Outcomes from an earlier attempt don't count towards the current one.
  const outcome = speech?.attempt === attempt ? speech.outcome : null
  const voiceBlocked = voice && outcome === 'blocked'
  const speechSettled = !voice || outcome !== null

  const enableVoice = useCallback(() => setAttempt((a) => a + 1), [])

  // --- typing -------------------------------------------------------------
  useEffect(() => {
    let head = 0
    let sub = 0
    let subTimer: ReturnType<typeof setInterval> | undefined

    const headTimer = setInterval(() => {
      head += 1
      setTyped({ head: headline.slice(0, head), sub: '', done: false })
      if (head < headline.length) return

      clearInterval(headTimer)
      subTimer = setInterval(
        () => {
          sub += 1
          const finished = sub >= subline.length
          setTyped({ head: headline, sub: subline.slice(0, sub), done: finished })
          if (finished) clearInterval(subTimer)
        },
        Math.max(12, speed * 0.34),
      )
    }, speed)

    return () => {
      clearInterval(headTimer)
      if (subTimer) clearInterval(subTimer)
    }
  }, [headline, subline, speed])

  // --- speech -------------------------------------------------------------
  useEffect(() => {
    if (!voice) return
    // The comma reads better than a full stop between the two lines.
    const text = `${headline.replace('.', ',')} ${subline}`
    return speak(text, {
      onSettled: (result) => setSpeech({ attempt, outcome: result }),
    })
  }, [headline, subline, voice, attempt])

  // Any interaction grants sticky activation, so retry the moment one lands.
  useEffect(() => {
    if (!voiceBlocked) return
    return onFirstGesture(enableVoice)
  }, [voiceBlocked, enableVoice])

  // --- hand-off -----------------------------------------------------------
  useEffect(() => {
    if (!typed.done) return
    const wait = voiceBlocked ? BLOCKED_HOLD : speechSettled ? holdMs : MAX_SPEECH_WAIT
    const timer = setTimeout(() => finishedRef.current?.(), wait)
    return () => clearTimeout(timer)
  }, [typed.done, speechSettled, voiceBlocked, holdMs])

  const total = Math.max(1, headline.length + subline.length)
  return {
    headline: typed.head,
    subline: typed.sub,
    done: typed.done,
    progress: Math.round(((typed.head.length + typed.sub.length) / total) * 100),
    voiceBlocked,
    enableVoice,
  }
}
