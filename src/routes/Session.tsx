import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BookOpen,
  Check,
  Clock,
  Layers,
  MessagesSquare,
  Mic,
  Pause,
  Phone,
  Play,
  Plus,
  Repeat,
  SkipForward,
  Sparkles,
  Waves,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, Eyebrow, LinkButton, ProgressRing, StreakBadge } from '../components/ui'
import { ReviewDeck, type ReviewResult } from '../components/ReviewDeck'
import { ConversationStage, ShadowingStage, SpeakStage, StructureStage } from '../components/session/Stages'
import { REVIEW_CAP } from '../config'
import { db, newId, type RecordingRow, type SessionMode, type StageId } from '../db/schema'
import { chime, fanfare, unlockAudio } from '../lib/chime'
import { contentWeek } from '../lib/program'
import {
  createSession,
  current,
  extend,
  finishEarly,
  formatClock,
  formatDuration,
  isFinished,
  isOvertime,
  isResumable,
  restoreSession,
  next,
  plannedTotalSec,
  remainingSec,
  skip,
  speakingSec,
  STAGE_INFO,
  tick,
  toStageLogs,
  totalSec,
  type SessionState,
} from '../lib/session'
import { ensureDeck } from '../lib/srs'
import { currentStreak, totalsByDay } from '../lib/streak'
import { useWakeLock } from '../lib/wakeLock'

const STAGE_ICONS: Record<StageId, LucideIcon> = {
  review: Layers,
  structure: BookOpen,
  shadowing: Waves,
  speak: Mic,
  conversation: MessagesSquare,
}

interface Activity {
  review: ReviewResult
  recordings: RecordingRow[]
  shadowReps: number
  callMinutes: number
}

interface Resume {
  id: string
  startedAt: number
  day: string
  state: SessionState
  lessonLog: string
  activity: Activity
}

const EMPTY_ACTIVITY: Activity = { review: { reviewed: 0, again: 0 }, recordings: [], shadowReps: 0, callMinutes: 0 }

/** Route wrapper: starts a new session, or loads a saved one when ?resume=<id>. */
export function Session() {
  const [params] = useSearchParams()
  const { today } = useApp()
  const resumeId = params.get('resume')
  const modeParam = Number(params.get('mode'))
  const mode: SessionMode = ([10, 30, 45, 60] as const).includes(modeParam as SessionMode) ? (modeParam as SessionMode) : 30
  const [resume, setResume] = useState<Resume | null | 'missing'>(resumeId ? null : 'missing')

  useEffect(() => {
    if (!resumeId) return
    ;(async () => {
      const row = await db.sessions.get(resumeId)
      if (!row || !isResumable(row, today)) return setResume('missing')
      const recordings = (await db.recordings.bulkGet(row.activity?.recordingIds ?? [])).filter((r): r is RecordingRow => !!r)
      setResume({
        id: row.id,
        startedAt: row.startedAt,
        day: row.day,
        state: restoreSession(row.mode, row.stages, row.currentIndex ?? 0),
        lessonLog: row.externalLesson ?? '',
        activity: {
          review: { reviewed: row.activity?.reviewed ?? 0, again: row.activity?.again ?? 0 },
          recordings,
          shadowReps: row.activity?.shadowReps ?? 0,
          callMinutes: row.activity?.callMinutes ?? 0,
        },
      })
    })()
  }, [resumeId, today])

  if (resume === null) return <p className="p-10 text-center font-bold text-muted">Picking up where you left off…</p>
  if (resume === 'missing') return <SessionPlayer mode={mode} />
  return <SessionPlayer mode={resume.state.mode} resume={resume} />
}

function SessionPlayer({ mode, resume }: { mode: SessionMode; resume?: Resume }) {
  const { pack, lang, plan, today } = useApp()
  const navigate = useNavigate()
  const week = pack.weeks[(plan ? contentWeek(plan, today) : 1) - 1]

  const [session, setSession] = useState<SessionState>(() => resume?.state ?? createSession(mode))
  const [paused, setPaused] = useState(false)
  const [deckReady, setDeckReady] = useState(false)
  const [lessonLog, setLessonLog] = useState(resume?.lessonLog ?? '')
  const [activity, setActivity] = useState<Activity>(resume?.activity ?? EMPTY_ACTIVITY)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const ids = useRef({ id: resume?.id ?? newId(), startedAt: resume?.startedAt ?? Date.now(), day: resume?.day ?? today })
  // Reviews done before resuming; the deck reports counts for this visit only.
  const reviewBase = useRef(resume?.activity.review ?? { reviewed: 0, again: 0 })
  const chimed = useRef<number>(-1)
  const finished = isFinished(session)
  useWakeLock(!finished && !paused)

  // Cards for every week reached so far.
  useEffect(() => {
    ensureDeck(pack, week.week).then(() => setDeckReady(true))
  }, [pack, week.week])

  // Wall-clock timer; pauses while the app is hidden (e.g. phone locked).
  useEffect(() => {
    if (finished || paused) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const delta = (now - last) / 1000
      last = now
      if (document.visibilityState === 'visible') setSession((s) => tick(s, Math.min(delta, 5)))
    }, 1000)
    return () => clearInterval(id)
  }, [finished, paused])

  // Gentle chime once when a stage's time is up.
  const st = current(session)
  useEffect(() => {
    if (st && isOvertime(st) && chimed.current !== session.index) {
      chimed.current = session.index
      chime()
    }
  }, [st, session.index])

  // Save progress: on every stage change, every 15 s, when the app is hidden, and at the end.
  const latest = useRef({ session, lessonLog, activity })
  latest.current = { session, lessonLog, activity }
  const save = useCallback(async () => {
    const { session: s, lessonLog: log, activity: a } = latest.current
    const completed = isFinished(s)
    await db.sessions.put({
      id: ids.current.id,
      lang,
      day: ids.current.day,
      mode: s.mode,
      startedAt: ids.current.startedAt,
      endedAt: completed ? Date.now() : undefined,
      stages: toStageLogs(s),
      spokenSec: Math.round(speakingSec(s)),
      completed,
      externalLesson: log || undefined,
      currentIndex: s.index,
      activity: {
        reviewed: a.review.reviewed,
        again: a.review.again,
        recordingIds: a.recordings.map((r) => r.id),
        shadowReps: a.shadowReps,
        callMinutes: a.callMinutes,
      },
    })
  }, [lang])
  useEffect(() => {
    void save()
    if (finished) fanfare()
  }, [session.index, finished, save])
  useEffect(() => {
    const id = setInterval(() => void save(), 15_000)
    const onHide = () => document.visibilityState === 'hidden' && void save()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [save])

  const act = (fn: (s: SessionState) => SessionState) => {
    unlockAudio()
    setSession(fn)
  }
  const addRecording = (r: RecordingRow) => setActivity((a) => ({ ...a, recordings: [...a.recordings, r] }))

  if (finished) return <Summary session={session} activity={activity} />

  const idx = session.index
  const info = STAGE_INFO[st!.stage]
  const over = isOvertime(st!)
  const isLast = idx === session.stages.length - 1

  return (
    <div className="safe-top safe-x min-h-dvh">
      <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-40 sm:px-6">
        {/* Top bar: close, stage stepper */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setConfirmEnd(true)} aria-label="End session" icon={<X size={22} />} />
          <ol className="flex flex-1 gap-1.5" aria-label="Stages">
            {session.stages.map((s, j) => {
              const Icon = STAGE_ICONS[s.stage]
              return (
                <li
                  key={s.stage}
                  className={cx(
                    'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold',
                    j === idx ? 'bg-accent text-on-accent' : s.status === 'done' ? 'bg-good-soft text-good' : s.status === 'skipped' ? 'bg-sunk text-muted line-through' : 'bg-sunk text-muted',
                  )}
                  aria-current={j === idx ? 'step' : undefined}
                >
                  {s.status === 'done' ? <Check size={16} strokeWidth={3} /> : <Icon size={16} strokeWidth={2.5} />}
                  <span className="hidden sm:inline">{STAGE_INFO[s.stage].title}</span>
                </li>
              )
            })}
          </ol>
        </div>

        {/* Stage header with timer */}
        <header className="mt-6 mb-6 flex items-center gap-5">
          <ProgressRing
            value={Math.min(st!.elapsedSec, st!.plannedSec)}
            max={st!.plannedSec}
            size={92}
            stroke={9}
            color={over ? 'var(--gold)' : 'var(--accent)'}
            label={over ? `Time is up, ${formatClock(st!.elapsedSec - st!.plannedSec)} over` : `${formatClock(remainingSec(st!))} left in this stage`}
          >
            <span className={cx('text-lg font-black tabular-nums', over && 'text-gold-ink')}>
              {over ? `+${formatClock(st!.elapsedSec - st!.plannedSec)}` : formatClock(remainingSec(st!))}
            </span>
          </ProgressRing>
          <div className="min-w-0">
            <Eyebrow>
              Stage {idx + 1} of {session.stages.length}
              {paused && ' · paused'}
            </Eyebrow>
            <h1 className="text-3xl font-black leading-tight">{info.title}</h1>
            <p className="font-semibold text-muted">{over ? "Time's up. Finish what you're doing, then move on." : info.blurb}</p>
          </div>
        </header>

        {/* Stage content */}
        <div key={idx}>
          {st!.stage === 'review' &&
            (deckReady ? (
              <ReviewDeck
                cap={session.mode === 10 ? REVIEW_CAP.short : REVIEW_CAP.full}
                onProgress={(r) =>
                  setActivity((a) => ({ ...a, review: { reviewed: reviewBase.current.reviewed + r.reviewed, again: reviewBase.current.again + r.again } }))
                }
              />
            ) : (
              <p className="py-10 text-center font-bold text-muted">Preparing your cards…</p>
            ))}
          {st!.stage === 'structure' && <StructureStage week={week} lessonLog={lessonLog} onLessonLog={setLessonLog} />}
          {st!.stage === 'shadowing' && <ShadowingStage week={week} onRep={() => setActivity((a) => ({ ...a, shadowReps: a.shadowReps + 1 }))} />}
          {st!.stage === 'speak' && <SpeakStage week={week} count={session.mode === 10 ? 1 : session.mode === 60 ? 3 : 2} onRecorded={addRecording} />}
          {st!.stage === 'conversation' && (
            <ConversationStage onCallLogged={(m) => setActivity((a) => ({ ...a, callMinutes: a.callMinutes + m }))} onRecorded={addRecording} />
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-3 sm:px-6">
          <Button onClick={() => setPaused(!paused)} icon={paused ? <Play size={20} /> : <Pause size={20} />} aria-label={paused ? 'Resume timer' : 'Pause timer'} />
          <Button className="shrink-0 px-3 sm:px-5" onClick={() => act(skip)} icon={<SkipForward size={20} />} aria-label="Skip stage">
            <span className="hidden sm:inline">Skip</span>
          </Button>
          <Button className="shrink-0 px-3 sm:px-5" onClick={() => act((s) => extend(s))} icon={<Plus size={18} />} aria-label="Add 2 minutes">
            2 min
          </Button>
          <Button variant={isLast ? 'good' : 'primary'} className="min-w-0 flex-1 px-3" onClick={() => act(next)}>
            {isLast ? 'Finish' : 'Next stage'}
          </Button>
        </div>
      </div>

      {confirmEnd && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-4 sm:place-items-center" role="dialog" aria-modal aria-labelledby="end-title">
          <Card className="pop-in w-full max-w-md space-y-4">
            <h2 id="end-title" className="text-2xl font-black">
              End the session now?
            </h2>
            <p className="font-semibold text-muted">Everything so far is saved and counts toward today, including your streak if you reached 10 minutes.</p>
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" onClick={() => setConfirmEnd(false)}>
                Keep going
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setConfirmEnd(false)
                  act(finishEarly)
                }}
              >
                End session
              </Button>
            </div>
            <button className="w-full text-sm font-bold text-muted underline" onClick={() => navigate('/')}>
              Leave without the summary
            </button>
          </Card>
        </div>
      )}
    </div>
  )
}

// Summary -------------------------------------------------------------------------

function Summary({ session, activity }: { session: SessionState; activity: Activity }) {
  const { lang, today } = useApp()
  const sessions = useLiveQuery(() => db.sessions.where('lang').equals(lang).toArray(), [lang], [])
  const streak = currentStreak(totalsByDay(sessions), today)
  const totalS = totalSec(session)
  const plannedS = plannedTotalSec(session)
  const recSec = activity.recordings.reduce((n, r) => n + r.durationSec, 0)
  const logs = toStageLogs(session)
  const maxBar = Math.max(...logs.map((l) => Math.max(l.actualSec, l.plannedSec)), 1)

  const facts: { icon: LucideIcon; tone: string; text: string }[] = [
    { icon: Clock, tone: 'bg-accent-soft text-accent', text: `Studied ${formatDuration(totalS)} (planned ${formatDuration(plannedS)})` },
    { icon: Mic, tone: 'bg-rouge-soft text-rouge', text: `${formatDuration(speakingSec(session))} of speaking practice` },
  ]
  if (activity.review.reviewed)
    facts.push({
      icon: Layers,
      tone: 'bg-good-soft text-good',
      text: `Said ${activity.review.reviewed} phrase${activity.review.reviewed === 1 ? '' : 's'} out loud${activity.review.again ? ` (${activity.review.again} to practise again)` : ''}`,
    })
  if (activity.recordings.length)
    facts.push({
      icon: Mic,
      tone: 'bg-rouge-soft text-rouge',
      text: `Recorded ${activity.recordings.length} answer${activity.recordings.length === 1 ? '' : 's'} (${formatClock(recSec)} of you speaking)`,
    })
  if (activity.shadowReps) facts.push({ icon: Repeat, tone: 'bg-accent-soft text-accent', text: `Shadowed ${activity.shadowReps} time${activity.shadowReps === 1 ? '' : 's'}` })
  if (activity.callMinutes) facts.push({ icon: Phone, tone: 'bg-gold-soft text-gold-ink', text: `Logged a ${activity.callMinutes}-min call` })

  return (
    <div className="safe-top safe-x safe-bottom relative min-h-dvh overflow-hidden">
      <Confetti />
      <div className="relative mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
        <div className="text-center">
          <div className="pop-in mx-auto grid h-24 w-24 place-items-center rounded-full bg-gold text-[#3d2a00]">
            <Sparkles size={48} strokeWidth={2.2} />
          </div>
          <h1 className="mt-5 text-4xl font-black">{totalS >= plannedS ? 'Session complete!' : 'Nice work today!'}</h1>
          <div className="mt-3 flex justify-center">
            <StreakBadge days={streak} size="lg" />
          </div>
        </div>

        <Card>
          <Eyebrow className="mb-3">What you did</Eyebrow>
          <ul className="space-y-3">
            {facts.map((f, i) => (
              <li key={i} className="pop-in flex items-center gap-3" style={{ animationDelay: `${150 + i * 90}ms` }}>
                <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', f.tone)}>
                  <f.icon size={20} />
                </span>
                <span className="text-lg font-extrabold">{f.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <Eyebrow className="mb-3">Minutes by stage</Eyebrow>
          <ul className="space-y-3">
            {logs.map((l) => (
              <li key={l.stage}>
                <div className="mb-1 flex justify-between text-sm font-extrabold">
                  <span>{STAGE_INFO[l.stage].title}</span>
                  <span className="text-muted">{l.skipped && l.actualSec < 30 ? 'skipped' : `${formatClock(l.actualSec)} / ${formatClock(l.plannedSec)}`}</span>
                </div>
                <div className="relative h-3 rounded-full bg-sunk">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-line" style={{ width: `${(l.plannedSec / maxBar) * 100}%` }} />
                  <div className={cx('absolute inset-y-0 left-0 rounded-full', l.stage === 'review' || l.stage === 'structure' ? 'bg-accent' : 'bg-rouge')} style={{ width: `${(l.actualSec / maxBar) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-bold text-muted">Red bars are speaking stages. Grey shows the planned time.</p>
        </Card>

        <LinkButton to="/" variant="primary" size="xl" className="w-full">
          Back to Today
        </LinkButton>
      </div>
    </div>
  )
}

function Confetti() {
  const colours = ['var(--accent)', 'var(--rouge)', 'var(--gold)', 'var(--good)', '#ffffff']
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="confetti absolute top-0 block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: colours[i % colours.length],
            animationDelay: `${(i % 12) * 90}ms`,
            animationDuration: `${2200 + ((i * 53) % 1400)}ms`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  )
}
