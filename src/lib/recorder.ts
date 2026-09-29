// Microphone recording with MediaRecorder. Picks a format the current browser can
// both record and play back: AAC/MP4 on Safari (iPhone, Mac), Opus/WebM elsewhere.

const CANDIDATES = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']

export function recordingSupported(): boolean {
  return typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia
}

export function pickMimeType(isSupported: (t: string) => boolean = (t) => MediaRecorder.isTypeSupported(t)): string {
  return CANDIDATES.find((t) => isSupported(t)) ?? ''
}

export class MicError extends Error {
  constructor(
    public kind: 'denied' | 'no-device' | 'unsupported' | 'insecure' | 'other',
    message: string,
  ) {
    super(message)
  }
}

export function micErrorFrom(e: unknown): MicError {
  if (e instanceof MicError) return e
  const name = (e as { name?: string })?.name
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return new MicError(
      'denied',
      "Parlons isn't allowed to use the microphone. On iPhone: Settings → Safari → Microphone (or tap “aA” in the address bar → Website Settings). On a laptop: click the icon at the left of the address bar and allow the microphone.",
    )
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return new MicError('no-device', 'No microphone was found. Plug one in or check your sound settings.')
  return new MicError('other', 'The microphone could not be started. Try again, or reload the app.')
}

export interface Recording {
  blob: Blob
  mimeType: string
  durationSec: number
}

export interface ActiveRecorder {
  stop: () => Promise<Recording>
  cancel: () => void
  /** Live input level 0–1, for a simple meter. */
  level: () => number
}

export async function startRecording(): Promise<ActiveRecorder> {
  if (!window.isSecureContext) throw new MicError('insecure', 'Recording needs a secure (https) connection.')
  if (!recordingSupported()) throw new MicError('unsupported', "This browser can't record audio. Try Safari on iPhone or Chrome on a laptop.")
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
  } catch (e) {
    throw micErrorFrom(e)
  }
  const mimeType = pickMimeType()
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  const started = performance.now()

  // Level meter
  let analyser: AnalyserNode | null = null
  let actx: AudioContext | null = null
  try {
    actx = new AudioContext()
    analyser = actx.createAnalyser()
    analyser.fftSize = 512
    actx.createMediaStreamSource(stream).connect(analyser)
  } catch {
    analyser = null
  }
  const buf = new Uint8Array(256)

  const cleanup = () => {
    stream.getTracks().forEach((t) => t.stop())
    void actx?.close()
  }
  rec.start(1000)

  return {
    level: () => {
      if (!analyser) return 0
      analyser.getByteTimeDomainData(buf)
      let peak = 0
      for (const v of buf) peak = Math.max(peak, Math.abs(v - 128))
      return Math.min(1, peak / 64)
    },
    cancel: () => {
      rec.onstop = null
      if (rec.state !== 'inactive') rec.stop()
      cleanup()
    },
    stop: () =>
      new Promise<Recording>((resolve) => {
        rec.onstop = () => {
          cleanup()
          const type = rec.mimeType || mimeType || chunks[0]?.type || 'audio/webm'
          resolve({ blob: new Blob(chunks, { type }), mimeType: type, durationSec: (performance.now() - started) / 1000 })
        }
        rec.stop()
      }),
  }
}
