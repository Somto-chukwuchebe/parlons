import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type ReactNode } from 'react'
import { Pause, Play, Repeat, Volume2, Waypoints, X } from 'lucide-react'
import { useApp } from '../app/AppContext'
import type { ClipRow, RecordingRow } from '../db/schema'
import type { AudioClip } from '../packs/types'
import { clipUrl, playUrl, stopAudio } from '../lib/audio'
import { formatClock } from '../lib/session'
import { speak, stopSpeaking } from '../lib/tts'
import { PronunciationCheck } from './PronunciationCheck'
import { Recorder } from './Recorder'
import { Button, Card, cx, Eyebrow, TL } from './ui'

// Shadowing: listen → record yourself → play both back to back → rate.
// Works with bundled native clips, your own imported audio, or the device voice.

export type ShadowSource =
  | { kind: 'native'; clip: AudioClip }
  | { kind: 'import'; clip: ClipRow }
  | { kind: 'tts'; id: string; text: string; en?: string }

export const sourceId = (s: ShadowSource) => (s.kind === 'native' ? `native:${s.clip.id}` : s.kind === 'import' ? `clip:${s.clip.id}` : `tts:${s.id}`)
export const sourceText = (s: ShadowSource) => (s.kind === 'native' ? s.clip.text : s.kind === 'import' ? (s.clip.text ?? '') : s.text)
const sourceEn = (s: ShadowSource) => (s.kind === 'native' ? s.clip.en : s.kind === 'tts' ? s.en : undefined)

const SPEEDS = [0.5, 0.75, 1, 1.25]

export function ShadowPlayer({ source, onRep, header }: { source: ShadowSource; onRep?: () => void; header?: ReactNode }) {
  const { pack, lang, profile, settings } = useApp()
  const [speed, setSpeed] = useState(1)
  const [mine, setMine] = useState<RecordingRow | null>(null)
  const text = sourceText(source)
  const en = sourceEn(source)

  // Audio sources get a real <audio> element for scrubbing and A-B loops.
  const blobUrl = useMemo(() => (source.kind === 'import' && source.clip.blob ? URL.createObjectURL(source.clip.blob) : null), [source])
  useEffect(() => () => void (blobUrl && URL.revokeObjectURL(blobUrl)), [blobUrl])
  const url = source.kind === 'native' ? clipUrl(lang, source.clip.id) : blobUrl

  useEffect(() => {
    setMine(null)
    return () => {
      stopAudio()
      stopSpeaking()
    }
  }, [source])

  const playSource = async () => {
    onRep?.()
    if (url) return audioRef.current?.playSegment()
    await speak(text, { locale: pack.speech.locale, voiceURI: profile?.voiceURI, rate: speed })
  }

  async function playBoth() {
    await playSource()
    await new Promise((r) => setTimeout(r, 350))
    if (mine) await playUrl(URL.createObjectURL(mine.blob))
  }

  const audioRef = useRef<{ playSegment: () => Promise<void> } | null>(null)

  return (
    <Card className="space-y-5">
      {header}
      <div className="text-center">
        {source.kind === 'native' && (
          <p className="mb-2 text-xs font-extrabold text-good">
            Native speaker · {source.clip.speaker}
          </p>
        )}
        {text ? (
          <p className="text-2xl font-black leading-snug sm:text-3xl">
            <TL>{text}</TL>
          </p>
        ) : (
          <p className="font-semibold text-muted">No transcript yet. Add one on the Shadowing page to follow along.</p>
        )}
        {settings.showEnglish && en && <p className="mt-2 font-semibold text-muted">{en}</p>}
      </div>

      {url ? (
        <AudioScrubber ref={audioRef} url={url} speed={speed} initialA={source.kind === 'import' ? source.clip.loopA : undefined} initialB={source.kind === 'import' ? source.clip.loopB : undefined} onPlay={onRep} />
      ) : (
        <TtsControls text={text} speed={speed} onRep={onRep} />
      )}

      <div className="flex flex-wrap items-center justify-center gap-2" role="radiogroup" aria-label="Speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={speed === s}
            onClick={() => setSpeed(s)}
            className={cx('min-h-10 rounded-xl px-3 text-sm font-extrabold', speed === s ? 'bg-accent text-on-accent' : 'bg-sunk text-muted')}
          >
            {s}×
          </button>
        ))}
      </div>

      <div className="space-y-3 border-t-2 border-dashed border-line pt-5">
        <Eyebrow className="text-center">Now you: record yourself saying it</Eyebrow>
        <Recorder kind="shadow" promptId={sourceId(source)} promptText={text} review="compact" onSaved={setMine} onDeleted={() => setMine(null)} />
        {mine && (
          <Button variant="primary" className="w-full" icon={<Waypoints size={20} />} onClick={playBoth}>
            Play both: original, then me
          </Button>
        )}
      </div>

      {text && (
        <div className="border-t-2 border-dashed border-line pt-5">
          <PronunciationCheck target={text} />
        </div>
      )}
    </Card>
  )
}

function TtsControls({ text, speed, onRep }: { text: string; speed: number; onRep?: () => void }) {
  const { pack, profile } = useApp()
  const [looping, setLooping] = useState(false)
  const loop = useRef(false)
  const say = () => speak(text, { locale: pack.speech.locale, voiceURI: profile?.voiceURI, rate: speed })

  async function toggleLoop() {
    if (loop.current) {
      loop.current = false
      setLooping(false)
      stopSpeaking()
      return
    }
    loop.current = true
    setLooping(true)
    for (let n = 0; n < 5 && loop.current; n++) {
      const t0 = performance.now()
      await say()
      onRep?.()
      await new Promise((r) => setTimeout(r, Math.max(1500, (performance.now() - t0) * 1.3)))
    }
    loop.current = false
    setLooping(false)
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Button
        variant="primary"
        size="lg"
        icon={<Volume2 size={22} />}
        onClick={() => {
          onRep?.()
          void say()
        }}
      >
        Listen
      </Button>
      <Button variant={looping ? 'rouge' : 'secondary'} size="lg" icon={<Repeat size={22} />} onClick={toggleLoop}>
        {looping ? 'Stop' : 'Loop ×5'}
      </Button>
    </div>
  )
}


/** Audio with a scrub bar, A-B loop points and a "pause to repeat" loop. */
const AudioScrubber = forwardRef<
  { playSegment: () => Promise<void> },
  { url: string; speed: number; initialA?: number; initialB?: number; onPlay?: () => void }
>(function AudioScrubber({ url, speed, initialA, initialB, onPlay }, ref) {
  const el = useRef<HTMLAudioElement>(null)
  const [dur, setDur] = useState(0)
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [a, setA] = useState<number | undefined>(initialA)
  const [b, setB] = useState<number | undefined>(initialB)
  const [loop, setLoop] = useState(false)
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const start = a ?? 0
  const end = b ?? dur

  useEffect(() => {
    const audio = el.current
    if (!audio) return
    audio.playbackRate = speed
    ;(audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true
  }, [speed])

  useEffect(() => () => void (gapTimer.current && clearTimeout(gapTimer.current)), [])

  useImperativeHandle(ref, () => ({
    playSegment: () =>
      new Promise<void>((resolve) => {
        const audio = el.current
        if (!audio) return resolve()
        audio.currentTime = start
        const check = () => {
          if (audio.currentTime >= end - 0.05 || audio.ended) {
            audio.removeEventListener('timeupdate', check)
            audio.removeEventListener('ended', check)
            audio.pause()
            resolve()
          }
        }
        audio.addEventListener('timeupdate', check)
        audio.addEventListener('ended', check)
        void audio.play().catch(() => resolve())
      }),
  }))

  function onTime() {
    const audio = el.current!
    setT(audio.currentTime)
    if (loop && b !== undefined && audio.currentTime >= b) {
      // Pause for about as long as the segment, so you can repeat it, then go again.
      audio.pause()
      const gap = Math.max(1200, ((b - start) / speed) * 1000)
      gapTimer.current = setTimeout(() => {
        audio.currentTime = start
        void audio.play()
        onPlay?.()
      }, gap)
    }
  }

  function toggle() {
    const audio = el.current!
    if (audio.paused) {
      if (audio.currentTime < start || audio.currentTime >= end - 0.05) audio.currentTime = start
      void audio.play()
      onPlay?.()
    } else audio.pause()
  }

  const pct = (x: number) => (dur ? `${(x / dur) * 100}%` : '0%')

  return (
    <div className="space-y-3">
      <audio
        ref={el}
        src={url}
        preload="metadata"
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
        onTimeUpdate={onTime}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          if (loop) {
            gapTimer.current = setTimeout(() => {
              el.current!.currentTime = start
              void el.current!.play()
            }, Math.max(1200, ((end - start) / speed) * 1000))
          }
        }}
      />
      <div className="flex items-center gap-3">
        <button onClick={toggle} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent" aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="relative h-8">
            <input
              type="range"
              min={0}
              max={dur || 1}
              step={0.05}
              value={t}
              onChange={(e) => {
                el.current!.currentTime = Number(e.target.value)
                setT(Number(e.target.value))
              }}
              className="absolute inset-0 w-full accent-[var(--accent)]"
              aria-label="Position"
            />
            {a !== undefined && dur > 0 && <span className="pointer-events-none absolute -top-1 h-2 w-1 rounded bg-rouge" style={{ left: pct(a) }} aria-hidden />}
            {b !== undefined && dur > 0 && <span className="pointer-events-none absolute -top-1 h-2 w-1 rounded bg-rouge" style={{ left: pct(b) }} aria-hidden />}
          </div>
          <p className="text-xs font-bold text-muted tabular-nums">
            {formatClock(t)} / {formatClock(dur)}
            {(a !== undefined || b !== undefined) && ` · loop ${formatClock(start)}–${formatClock(end)}`}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setA(el.current?.currentTime ?? 0)}>
          Set A
        </Button>
        <Button size="sm" onClick={() => setB(Math.max(el.current?.currentTime ?? 0, (a ?? 0) + 0.3))}>
          Set B
        </Button>
        {(a !== undefined || b !== undefined) && (
          <Button size="sm" variant="ghost" icon={<X size={16} />} onClick={() => {
              setA(undefined)
              setB(undefined)
            }}>
            Clear
          </Button>
        )}
        <Button size="sm" variant={loop ? 'rouge' : 'secondary'} icon={<Repeat size={16} />} onClick={() => setLoop(!loop)} aria-pressed={loop}>
          Loop with pause {loop ? 'on' : 'off'}
        </Button>
      </div>
    </div>
  )
})
