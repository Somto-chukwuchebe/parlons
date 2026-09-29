import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Mic, Pause, Play, RotateCcw, Square, Trash2 } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { db, newId, type RecordingKind, type RecordingRow } from '../db/schema'
import { contentWeek } from '../lib/program'
import { micErrorFrom, startRecording, type ActiveRecorder } from '../lib/recorder'
import { storageErrorMessage } from '../lib/storage'
import { formatClock } from '../lib/session'
import { Button, cx, Notice } from './ui'

// Big record button → live meter and timer → playback. Saves straight to the device.
// Phase 3 adds self-ratings and mistake tagging on top of this.

export function Recorder({
  kind,
  promptId,
  promptText,
  maxSec,
  onSaved,
  onDeleted,
}: {
  kind: RecordingKind
  promptId?: string
  promptText?: string
  /** Stop automatically after this many seconds (e.g. 60 for self-talk). */
  maxSec?: number
  onSaved?: (r: RecordingRow) => void
  onDeleted?: (id: string) => void
}) {
  const { lang, plan, today } = useApp()
  const [state, setState] = useState<'idle' | 'starting' | 'recording' | 'saved'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(0)
  const [saved, setSaved] = useState<RecordingRow | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const rec = useRef<ActiveRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const started = useRef(0)

  useEffect(() => () => rec.current?.cancel(), [])
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])

  useEffect(() => {
    if (state !== 'recording') return
    let raf = 0
    const loop = () => {
      const secs = (performance.now() - started.current) / 1000
      setElapsed(secs)
      setLevel(rec.current?.level() ?? 0)
      if (maxSec && secs >= maxSec) void stop()
      else raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [state])

  async function start() {
    setError(null)
    setState('starting')
    try {
      rec.current = await startRecording()
      started.current = performance.now()
      setElapsed(0)
      setState('recording')
    } catch (e) {
      setError(micErrorFrom(e).message)
      setState('idle')
    }
  }

  async function stop() {
    const r = rec.current
    if (!r) return
    rec.current = null
    const out = await r.stop()
    try {
      const row: RecordingRow = {
        id: newId(),
        lang,
        day: today,
        week: plan ? contentWeek(plan, today) : 1,
        kind,
        promptId,
        promptText,
        blob: out.blob,
        mimeType: out.mimeType,
        durationSec: Math.round(out.durationSec * 10) / 10,
        createdAt: Date.now(),
      }
      await db.recordings.add(row)
      setSaved(row)
      setUrl(URL.createObjectURL(out.blob))
      setState('saved')
      onSaved?.(row)
    } catch (e) {
      setError(storageErrorMessage(e))
      setState('idle')
    }
  }

  async function discard() {
    if (saved) {
      await db.recordings.delete(saved.id)
      onDeleted?.(saved.id)
    }
    setSaved(null)
    setUrl(null)
    setState('idle')
  }

  function togglePlay() {
    const a = audioRef.current
    if (!a) return
    if (a.paused) void a.play()
    else a.pause()
  }

  return (
    <div className="space-y-3">
      {state !== 'saved' ? (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={state === 'recording' ? stop : start}
            disabled={state === 'starting'}
            aria-label={state === 'recording' ? 'Stop recording' : 'Start recording'}
            className={cx(
              'press relative grid h-24 w-24 place-items-center rounded-full text-white transition-colors dark:text-[#2a0906]',
              state === 'recording' ? 'bg-ink dark:bg-ink' : 'bg-rouge',
            )}
            style={{ '--lip': 'color-mix(in oklab, var(--rouge) 55%, black)' } as CSSProperties}
          >
            {state === 'recording' && (
              <span
                className="absolute inset-0 rounded-full border-4 border-rouge transition-transform"
                style={{ transform: `scale(${1 + level * 0.35})`, opacity: 0.6 }}
                aria-hidden
              />
            )}
            {state === 'recording' ? <Square size={32} fill="currentColor" className="text-bg" /> : <Mic size={40} strokeWidth={2.4} />}
          </button>
          <p className="text-sm font-extrabold text-muted" aria-live="polite">
            {state === 'recording'
              ? `Recording… ${formatClock(elapsed)}${maxSec ? ` / ${formatClock(maxSec)}` : ''}`
              : state === 'starting'
                ? 'Starting microphone…'
                : 'Tap to record your answer'}
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-sunk p-3">
          <audio ref={audioRef} src={url ?? undefined} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} preload="metadata" />
          <button onClick={togglePlay} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent" aria-label={playing ? 'Pause' : 'Listen back'}>
            {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-black">Saved · {formatClock(saved?.durationSec ?? 0)}</p>
            <p className="text-xs font-bold text-muted">Listen back: how did it sound?</p>
          </div>
          <Button size="sm" icon={<RotateCcw size={16} />} onClick={() => discard().then(start)} aria-label="Record again">
            Redo
          </Button>
          <Button size="sm" variant="ghost" onClick={discard} aria-label="Delete recording">
            <Trash2 size={16} />
          </Button>
        </div>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
    </div>
  )
}
