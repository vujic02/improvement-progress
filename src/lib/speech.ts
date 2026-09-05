/**
 * Thin wrapper over the Web Speech API that handles its two rough edges:
 *
 * 1. `getVoices()` is empty until the engine has loaded them, so the first
 *    utterance of a session silently picks the wrong voice — or none.
 * 2. Browsers refuse to speak until the document has user activation. There is
 *    no API to ask, so a blocked utterance looks identical to a slow one; we
 *    detect it by watching for a `start` event that never arrives.
 */

const VOICE_LOAD_TIMEOUT = 1000
const START_TIMEOUT = 1200
const PREFERRED = /en-GB|en_GB|British|Daniel|Arthur/i

export type SpeechOutcome = 'ended' | 'blocked' | 'unavailable'

export interface SpeakHandlers {
  /** Utterance finished, was blocked, or the API is missing. Fires exactly once. */
  onSettled: (outcome: SpeechOutcome) => void
}

let cachedVoices: SpeechSynthesisVoice[] | null = null

function getSynth(): SpeechSynthesis | undefined {
  return typeof window === 'undefined' ? undefined : window.speechSynthesis
}

/** Resolves once the voice list is populated, or after a short timeout. */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = getSynth()
  if (!synth) return Promise.resolve([])
  if (cachedVoices?.length) return Promise.resolve(cachedVoices)

  const immediate = synth.getVoices()
  if (immediate.length) {
    cachedVoices = immediate
    return Promise.resolve(immediate)
  }

  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      synth.removeEventListener('voiceschanged', finish)
      cachedVoices = synth.getVoices()
      resolve(cachedVoices)
    }
    synth.addEventListener('voiceschanged', finish)
    // Safari can populate the list without ever firing the event.
    setTimeout(finish, VOICE_LOAD_TIMEOUT)
  })
}

/**
 * Speaks `text` and reports how it ended. Returns a cancel function; cancelling
 * suppresses `onSettled`, so callers never mistake teardown for completion.
 */
export function speak(text: string, { onSettled }: SpeakHandlers): () => void {
  const synth = getSynth()
  if (!synth) {
    onSettled('unavailable')
    return () => {}
  }

  let cancelled = false
  let started = false
  let done = false
  let startWatchdog: ReturnType<typeof setTimeout> | undefined

  const settle = (outcome: SpeechOutcome) => {
    if (cancelled || done) return
    done = true
    clearTimeout(startWatchdog)
    onSettled(outcome)
  }

  void loadVoices().then((voices) => {
    if (cancelled) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 0.9
    utterance.volume = 1

    const preferred = voices.find((v) => PREFERRED.test(`${v.name} ${v.lang}`))
    const english = voices.find((v) => v.lang?.toLowerCase().startsWith('en'))
    const chosen = preferred ?? english
    if (chosen) utterance.voice = chosen

    utterance.onstart = () => {
      started = true
      clearTimeout(startWatchdog)
    }
    utterance.onend = () => settle('ended')
    utterance.onerror = (event) => {
      // 'canceled' / 'interrupted' are our own teardown, not a failure.
      if (event.error === 'canceled' || event.error === 'interrupted') return
      settle(event.error === 'not-allowed' ? 'blocked' : 'ended')
    }

    // Chrome can drop an utterance queued straight after a no-op cancel().
    if (synth.speaking || synth.pending) synth.cancel()
    synth.speak(utterance)

    // No 'start' this soon means autoplay policy swallowed it.
    startWatchdog = setTimeout(() => {
      if (!started && !synth.speaking) settle('blocked')
    }, START_TIMEOUT)
  })

  return () => {
    cancelled = true
    clearTimeout(startWatchdog)
    synth.cancel()
  }
}

/**
 * Calls `onUnlock` the first time the user touches the page. Browsers grant
 * sticky activation on any interaction, so one gesture is enough to let every
 * later utterance through.
 */
export function onFirstGesture(onUnlock: () => void): () => void {
  const events = ['pointerdown', 'keydown', 'touchstart'] as const
  const handler = () => {
    cleanup()
    onUnlock()
  }
  const cleanup = () => {
    for (const type of events) document.removeEventListener(type, handler)
  }
  for (const type of events) document.addEventListener(type, handler, { once: true })
  return cleanup
}
