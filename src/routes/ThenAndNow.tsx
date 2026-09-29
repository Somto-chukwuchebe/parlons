import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Lock, Mic, Pause, Play, Sparkles, Waypoints } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, Eyebrow, Notice, PageHeader, TL } from '../components/ui'
import { Recorder } from '../components/Recorder'
import { db, type RecordingRow } from '../db/schema'
import { playUrl, stopAudio } from '../lib/audio'
import { contentWeek } from '../lib/program'
import { formatClock } from '../lib/session'

// The same benchmark prompts recorded in weeks 1, 4, 8 and 12, so you can hear your progress.
export const ROUNDS = [1, 4, 8, 12] as const

/** The round you can record now: the latest round whose week has arrived. */
export function openRound(week: number): number {
  return [...ROUNDS].reverse().find((r) => week >= r) ?? 1
}

export function ThenAndNow() {
  const { pack, lang, plan, today } = useApp()
  const week = plan ? contentWeek(plan, today) : 1
  const round = openRound(week)
  const bench = useLiveQuery(() => db.recordings.where('[lang+kind]').equals([lang, 'benchmark']).toArray(), [lang], [])
  const snaps = useLiveQuery(() => db.recordings.where('[lang+kind]').equals([lang, 'snapshot']).toArray(), [lang], [])
  const [recording, setRecording] = useState<string | null>(null)

  /** Latest take per prompt and round. */
  const takes = useMemo(() => {
    const m = new Map<string, RecordingRow>()
    for (const r of [...bench].sort((a, b) => a.createdAt - b.createdAt)) m.set(`${r.promptId}@${r.round ?? 1}`, r)
    return m
  }, [bench])

  const snapshotPrompt = pack.benchmarkPrompts[0]
  const snapByWeek = useMemo(() => {
    const m = new Map<number, RecordingRow>()
    for (const r of [...snaps].sort((a, b) => a.createdAt - b.createdAt)) m.set(r.round ?? r.week, r)
    return m
  }, [snaps])

  return (
    <div>
      <PageHeader back="/speak" title="Then and now" subtitle="Record the same prompts in weeks 1, 4, 8 and 12. Then listen to how far you've come." />

      <Notice icon={<Sparkles size={20} />}>
        {week < 4 && round === 1
          ? 'Record your week 1 answers now, before you get better. Imperfect is the point: this is your starting line.'
          : `Round open now: week ${round}. Answer without preparing a script, just as you would in a conversation.`}
      </Notice>

      <div className="mt-6 space-y-6">
        {pack.benchmarkPrompts.map((p) => {
          const first = takes.get(`${p.id}@1`)
          const latest = [...ROUNDS].reverse().map((r) => takes.get(`${p.id}@${r}`)).find(Boolean)
          const key = `${p.id}@${round}`
          return (
            <Card key={p.id} className="space-y-4">
              <div>
                <TL className="text-xl font-black">{p.target}</TL>
                <p className="font-semibold text-muted">{p.en}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ROUNDS.map((r) => {
                  const take = takes.get(`${p.id}@${r}`)
                  const open = r === round
                  return (
                    <div key={r} className={cx('rounded-2xl p-3', open ? 'bg-accent-soft ring-2 ring-accent/40' : 'bg-sunk')}>
                      <p className="text-xs font-extrabold tracking-wider text-muted uppercase">Week {r}</p>
                      {take ? (
                        <PlayChip rec={take} />
                      ) : open ? (
                        <Button size="sm" variant="rouge" className="mt-1 w-full" icon={<Mic size={16} />} onClick={() => setRecording(key)}>
                          Record
                        </Button>
                      ) : (
                        <p className="mt-2 flex items-center gap-1 text-sm font-bold text-muted">
                          {r > round ? (
                            <>
                              <Lock size={14} /> Later
                            </>
                          ) : (
                            'Not recorded'
                          )}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
              {takes.get(key) && recording !== key && (
                <button className="text-sm font-bold text-accent underline" onClick={() => setRecording(key)}>
                  Record week {round} again
                </button>
              )}
              {recording === key && <Recorder kind="benchmark" promptId={p.id} promptText={p.target} round={round} maxSec={180} />}
              {first && latest && latest.id !== first.id && <CompareButton a={first} b={latest} />}
            </Card>
          )
        })}
      </div>

      <section className="mt-10">
        <Eyebrow className="mb-2">Weekly snapshot · optional, 2 minutes</Eyebrow>
        <Card className="space-y-4">
          <p className="font-semibold">
            Once a week (Sunday is ideal, with your weekly review), answer the same prompt for up to 2 minutes:{' '}
            <TL className="font-black">{snapshotPrompt.target}</TL>
          </p>
          {snapByWeek.get(week) ? (
            <div className="flex flex-wrap items-center gap-3">
              <PlayChip rec={snapByWeek.get(week)!} label={`This week's snapshot`} />
              <button className="text-sm font-bold text-accent underline" onClick={() => setRecording('snapshot')}>
                Record again
              </button>
            </div>
          ) : (
            recording !== 'snapshot' && (
              <Button variant="rouge" icon={<Mic size={18} />} onClick={() => setRecording('snapshot')}>
                Record week {week} snapshot
              </Button>
            )
          )}
          {recording === 'snapshot' && <Recorder kind="snapshot" promptId={snapshotPrompt.id} promptText={snapshotPrompt.target} round={week} maxSec={120} />}
          {snapByWeek.size > 0 && (
            <ul className="flex flex-wrap gap-2">
              {[...snapByWeek.entries()]
                .sort((a, b) => a[0] - b[0])
                .map(([w, rec]) => (
                  <li key={w}>
                    <PlayChip rec={rec} label={`W${w}`} />
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  )
}

function PlayChip({ rec, label }: { rec: RecordingRow; label?: string }) {
  const [playing, setPlaying] = useState(false)
  async function toggle() {
    if (playing) {
      stopAudio()
      setPlaying(false)
      return
    }
    setPlaying(true)
    const url = URL.createObjectURL(rec.blob)
    await playUrl(url)
    URL.revokeObjectURL(url)
    setPlaying(false)
  }
  return (
    <button onClick={toggle} className="mt-1 flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm font-extrabold ring-2 ring-line" aria-label={`Play ${label ?? 'recording'}`}>
      {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      {label ?? formatClock(rec.durationSec)}
      <span className="text-xs font-bold text-muted">{format(rec.createdAt, 'd MMM')}</span>
    </button>
  )
}

function CompareButton({ a, b }: { a: RecordingRow; b: RecordingRow }) {
  const [step, setStep] = useState<0 | 1 | 2>(0)
  async function play() {
    setStep(1)
    const ua = URL.createObjectURL(a.blob)
    await playUrl(ua)
    URL.revokeObjectURL(ua)
    await new Promise((r) => setTimeout(r, 800))
    setStep(2)
    const ub = URL.createObjectURL(b.blob)
    await playUrl(ub)
    URL.revokeObjectURL(ub)
    setStep(0)
  }
  return (
    <Button variant="primary" className="w-full" icon={<Waypoints size={20} />} onClick={step ? () => (stopAudio(), setStep(0)) : play}>
      {step === 1 ? `Playing week ${a.round ?? 1}…` : step === 2 ? `Now week ${b.round ?? '?'}…` : `Play week ${a.round ?? 1}, then week ${b.round ?? '?'}`}
    </Button>
  )
}
