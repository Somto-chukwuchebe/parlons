import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, Check, Flag, Mic, Pause, Play, Trophy, Waypoints } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, Eyebrow, Notice, PageHeader, TL } from '../components/ui'
import { Recorder } from '../components/Recorder'
import { db, type RecordingRow } from '../db/schema'
import { playUrl, stopAudio } from '../lib/audio'
import { CEFR_SPEAKING, estimateLevel } from '../lib/cefr'
import { contentWeek } from '../lib/program'
import { formatClock } from '../lib/session'

// Week 12: a structured, recorded 10-minute self-test in five parts, shown next to
// your week 1 recording, with a before/after A1–B1 self-assessment.

export function FluencyCheck() {
  const { pack, lang, plan, today, profile } = useApp()
  const week = plan ? contentWeek(plan, today) : 1
  const parts = pack.fluencyCheck
  const takes = useLiveQuery(() => db.recordings.where('[lang+kind]').equals([lang, 'fluency']).toArray(), [lang], [])
  const week1 = useLiveQuery(() => db.recordings.where('[lang+kind]').equals([lang, 'benchmark']).filter((r) => (r.round ?? 1) === 1).toArray(), [lang], [])
  const latest = (id: string) => [...takes].filter((t) => t.promptId === id).sort((a, b) => b.createdAt - a.createdAt)[0]
  const [step, setStep] = useState(() => Math.max(0, parts.findIndex((p) => !latest(p.id))))
  const done = parts.every((p) => latest(p.id))
  const [checked, setChecked] = useState<string[]>(profile?.finalCanDo ?? profile?.startingCanDo ?? [])
  const [savedLevel, setSavedLevel] = useState(profile?.finalLevel)

  const before = profile?.startingLevel ?? 'A0'
  const after = estimateLevel(checked)
  const lvl = (l: string) => (l === 'A0' ? 'Below A1' : l)

  async function saveAssessment() {
    if (!profile) return
    await db.profiles.update(lang, { finalCanDo: checked, finalLevel: after, finalCheckAt: Date.now() })
    setSavedLevel(after)
  }

  return (
    <div className="space-y-6">
      <PageHeader back="/progress" title="Final fluency check" subtitle="Ten minutes, five parts, recorded. No script, no English. Just keep talking." />
      {week < 12 && (
        <Notice icon={<Flag size={20} />}>
          This is designed for week 12 (you're in week {week}). You can do a practice run now; recording again later replaces it.
        </Notice>
      )}

      <ol className="grid grid-cols-5 gap-1.5" aria-label="Parts">
        {parts.map((p, i) => (
          <li key={p.id}>
            <button
              onClick={() => setStep(i)}
              className={cx('h-11 w-full rounded-xl text-sm font-black', i === step ? 'bg-accent text-on-accent' : latest(p.id) ? 'bg-good-soft text-good' : 'bg-sunk text-muted')}
              aria-current={i === step ? 'step' : undefined}
              aria-label={`Part ${i + 1}: ${p.title}${latest(p.id) ? ' (recorded)' : ''}`}
            >
              {latest(p.id) ? <Check size={18} className="mx-auto" /> : i + 1}
            </button>
          </li>
        ))}
      </ol>

      <Card className="space-y-4">
        <Eyebrow className="text-accent">
          Part {step + 1} of {parts.length} · about {parts[step].minutes} minutes
        </Eyebrow>
        <h2 className="text-2xl font-black">{parts[step].title}</h2>
        <p className="text-xl font-bold">
          <TL>{parts[step].target}</TL>
        </p>
        <p className="text-sm font-semibold text-muted">
          Stuck? Use a repair phrase such as “<TL>{pack.repairPhrases.find((p) => p.target.endsWith('…'))?.target ?? pack.repairPhrases[0].target}</TL>” and carry on. Pauses are fine; English isn't.
        </p>
        {latest(parts[step].id) && <SavedTake rec={latest(parts[step].id)!} />}
        <Recorder key={parts[step].id} kind="fluency" promptId={parts[step].id} promptText={parts[step].target} maxSec={parts[step].minutes * 60 + 60} />
        {step < parts.length - 1 && (
          <Button variant="primary" className="w-full" onClick={() => setStep(step + 1)}>
            Next part <ArrowRight size={20} />
          </Button>
        )}
      </Card>

      {done && (
        <>
          <Card className="space-y-4">
            <Eyebrow className="text-accent">Then and now</Eyebrow>
            <h2 className="text-2xl font-black">Week 1 you, and you today</h2>
            {week1.length ? (
              <Compare a={week1.sort((x, y) => x.createdAt - y.createdAt)[0]} b={latest(parts[0].id)!} />
            ) : (
              <p className="font-semibold text-muted">No week 1 "Then and now" recording was found, so there's nothing to compare with. Listen to your five parts above instead.</p>
            )}
          </Card>

          <Card className="space-y-4">
            <Eyebrow className="text-accent">Where are you now?</Eyebrow>
            <p className="font-semibold text-muted">Tick what you can do when speaking now. Same list as on day one, so the comparison is fair.</p>
            <ul className="space-y-2">
              {CEFR_SPEAKING.map((s) => {
                const on = checked.includes(s.id)
                const was = profile?.startingCanDo.includes(s.id)
                return (
                  <li key={s.id}>
                    <button
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => setChecked((c) => (on ? c.filter((x) => x !== s.id) : [...c, s.id]))}
                      className={cx('flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left font-semibold', on ? 'border-accent bg-accent-soft' : 'border-line bg-surface')}
                    >
                      <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2', on ? 'border-accent bg-accent text-on-accent' : 'border-line')}>{on && <Check size={16} strokeWidth={3.5} />}</span>
                      <span className="flex-1">{s.text}</span>
                      {on && !was && <span className="rounded-lg bg-gold-soft px-2 py-0.5 text-xs font-black text-gold-ink">New</span>}
                      <span className="rounded-lg bg-sunk px-2 py-0.5 text-xs font-black text-muted">{s.level}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-sunk p-4 text-center">
                <p className="text-xs font-extrabold tracking-wider text-muted uppercase">Day one</p>
                <p className="text-3xl font-black">{lvl(before)}</p>
              </div>
              <div className="rounded-2xl bg-gold-soft p-4 text-center">
                <p className="text-xs font-extrabold tracking-wider text-gold-ink uppercase">Now</p>
                <p className="text-3xl font-black text-gold-ink">{lvl(after)}</p>
              </div>
            </div>
            <Button variant="good" size="lg" className="w-full" icon={<Trophy size={20} />} onClick={saveAssessment}>
              Save my result
            </Button>
            {savedLevel && (
              <Notice tone="good">
                Saved: {lvl(before)} → {lvl(savedLevel)}. This is a self-assessment, a guide rather than an exam result. Your recordings are the real evidence.
              </Notice>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function SavedTake({ rec }: { rec: RecordingRow }) {
  const [playing, setPlaying] = useState(false)
  return (
    <button
      onClick={async () => {
        if (playing) {
          stopAudio()
          return setPlaying(false)
        }
        setPlaying(true)
        const u = URL.createObjectURL(rec.blob)
        await playUrl(u)
        URL.revokeObjectURL(u)
        setPlaying(false)
      }}
      className="flex items-center gap-2 rounded-xl bg-good-soft px-3 py-2 text-sm font-extrabold text-good"
    >
      {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />} Your recording · {formatClock(rec.durationSec)}
    </button>
  )
}

function Compare({ a, b }: { a: RecordingRow; b: RecordingRow }) {
  const [step, setStep] = useState(0)
  async function play() {
    setStep(1)
    const ua = URL.createObjectURL(a.blob)
    await playUrl(ua)
    URL.revokeObjectURL(ua)
    await new Promise((r) => setTimeout(r, 900))
    setStep(2)
    const ub = URL.createObjectURL(b.blob)
    await playUrl(ub)
    URL.revokeObjectURL(ub)
    setStep(0)
  }
  return (
    <div className="space-y-3">
      <p className="font-semibold text-muted">
        Week 1: <TL>{a.promptText ?? ''}</TL> ({formatClock(a.durationSec)}) · Today: <TL>{b.promptText ?? ''}</TL> ({formatClock(b.durationSec)})
      </p>
      <Button variant="primary" size="lg" className="w-full" icon={step ? <Mic size={20} /> : <Waypoints size={20} />} onClick={
          step
            ? () => {
                stopAudio()
                setStep(0)
              }
            : play
        }>
        {step === 1 ? 'Playing week 1…' : step === 2 ? 'Now: you today…' : 'Play week 1, then today'}
      </Button>
    </div>
  )
}
