// Optional pronunciation check using the browser's speech recognition.
// It shows what the device *heard* — approximate by nature — and never blocks anything.
// Chrome sends audio to Google; Safari uses Apple's servers (or on-device on recent iPhones).
// Either may be unavailable offline or in some regions: every failure is reported, not thrown.

type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

function ctor(): (new () => Recognition) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const recognitionSupported = () => ctor() !== null

export type HearResult = { ok: true; transcript: string; seconds: number } | { ok: false; reason: string }

export interface Listening {
  stop: () => void
  result: Promise<HearResult>
}

const REASONS: Record<string, string> = {
  'not-allowed': 'Microphone or speech recognition is not allowed. Check the browser’s permissions for this site.',
  'service-not-allowed': 'Speech recognition is turned off on this device (on iPhone: Settings → Siri → allow Siri or dictation).',
  network: 'Speech recognition needs an internet connection. The rest of the app works offline.',
  'no-speech': 'Nothing was heard. Try again, a little closer to the microphone.',
  'audio-capture': 'No microphone was found.',
  'language-not-supported': 'This device can’t recognise this language.',
}

/** Listen once. Call stop() when the learner finishes speaking (it also stops on silence). */
export function listen(locale: string): Listening {
  const C = ctor()
  if (!C) return { stop: () => {}, result: Promise.resolve({ ok: false, reason: 'Speech recognition isn’t available in this browser. Try Safari on iPhone or Chrome on a laptop.' }) }
  if (typeof navigator !== 'undefined' && navigator.onLine === false)
    return { stop: () => {}, result: Promise.resolve({ ok: false, reason: REASONS.network }) }
  const rec = new C()
  rec.lang = locale
  rec.interimResults = false
  rec.continuous = true
  rec.maxAlternatives = 1
  const started = performance.now()
  let text = ''
  let error: string | null = null
  const result = new Promise<HearResult>((resolve) => {
    rec.onresult = (e) => {
      text = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')
        .trim()
    }
    rec.onerror = (e) => {
      error = e.error
    }
    rec.onend = () => {
      const seconds = (performance.now() - started) / 1000
      if (text) resolve({ ok: true, transcript: text, seconds })
      else resolve({ ok: false, reason: REASONS[error ?? 'no-speech'] ?? 'Speech recognition stopped unexpectedly. Try again.' })
    }
  })
  try {
    rec.start()
  } catch {
    return { stop: () => {}, result: Promise.resolve({ ok: false, reason: 'Speech recognition could not start. Try again.' }) }
  }
  // Hard limit so it can never hang a session.
  const guard = setTimeout(() => rec.stop(), 30_000)
  return {
    stop: () => {
      clearTimeout(guard)
      rec.stop()
    },
    result,
  }
}

// Comparison ---------------------------------------------------------------------

/** Lower-case, strip accents' variants of punctuation and apostrophes, keep letters and digits. */
export function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "' ")
    .replace(/[«»"“”.,!?;:…()\-–—]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
}

/** Compare letters loosely: accents ignored (recognisers are inconsistent with them). */
const loose = (w: string) => w.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/'$/, '')

export type DiffToken = { word: string; status: 'match' | 'missed' | 'extra' }

/**
 * Word-level alignment (longest common subsequence). Returns the target's words marked
 * as matched or missed, with any extra heard words placed where they occurred.
 */
export function diffWords(target: string, heard: string): { tokens: DiffToken[]; score: number } {
  const a = words(target)
  const b = words(heard)
  const A = a.map(loose)
  const B = b.map(loose)
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const tokens: DiffToken[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (A[i] === B[j]) {
      tokens.push({ word: a[i], status: 'match' })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) tokens.push({ word: a[i++], status: 'missed' })
    else tokens.push({ word: b[j++], status: 'extra' })
  }
  while (i < a.length) tokens.push({ word: a[i++], status: 'missed' })
  while (j < b.length) tokens.push({ word: b[j++], status: 'extra' })
  const score = a.length ? dp[0][0] / a.length : 0
  return { tokens, score }
}

/** Words per minute from a transcript and the time it took. */
export function wordsPerMinute(transcript: string, seconds: number): number | null {
  const n = words(transcript).length
  if (!n || seconds < 1) return null
  return Math.round((n / seconds) * 60)
}
