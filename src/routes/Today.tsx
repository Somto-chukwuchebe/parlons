import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Award, CalendarCheck, ChevronRight, History, Layers, Mic, Play, ShieldAlert, Sparkles } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, Card, Eyebrow, Notice, ProgressRing, Segmented, StatPill, StreakBadge } from '../components/ui'
import { MetroLineCompact } from '../components/MetroLine'
import { APP_NAME, BACKUP_REMINDER_DAYS, CURRICULUM_WEEKS, PROGRAM_DAYS } from '../config'
import { db, type SessionMode } from '../db/schema'
import { contentWeek, fromDayKey, isReviewDay, phaseOn } from '../lib/program'
import { currentStreak, totalsByDay } from '../lib/streak'
import { ensureDeck, queueStats, type QueueStats } from '../lib/srs'
import { formatDuration, isResumable, STAGE_INFO } from '../lib/session'
import { speakingSeconds } from '../lib/stats'
import { ROUNDS } from './ThenAndNow'
import { ResumeShadowing } from '../components/ResumeShadowing'

export function Today() {
  const { pack, plan, today, profile, settings, lang } = useApp()
  const sessions = useLiveQuery(() => db.sessions.where('lang').equals(lang).toArray(), [lang], [])
  const canDo = useLiveQuery(() => db.canDo.where('lang').equals(lang).toArray(), [lang], [])
  const recordings = useLiveQuery(() => db.recordings.where('lang').equals(lang).toArray(), [lang], [])
  const conversations = useLiveQuery(() => db.conversations.where('lang').equals(lang).toArray(), [lang], [])
  const [mode, setMode] = useState<SessionMode>(profile?.dailyMinutes ?? 30)
  const [stats, setStats] = useState<QueueStats | null>(null)
  const navigate = useNavigate()
  const approved = !!profile?.seedApprovedAt
  const deckWeek = plan ? contentWeek(plan, today) : 1
  // Keep the deck in step with the course, then count what's due. Re-count when cards change.
  const cardCount = useLiveQuery(() => db.cards.where('lang').equals(lang).count(), [lang], 0)
  const reviewCount = useLiveQuery(() => db.reviewLogs.where('lang').equals(lang).count(), [lang], 0)
  useEffect(() => {
    if (!approved) return
    void ensureDeck(pack, deckWeek).then(() => queueStats(lang).then(setStats))
  }, [approved, pack, deckWeek, lang, cardCount, reviewCount])
  if (!plan || !profile) return null

  const phase = phaseOn(plan, today)
  const weekNo = contentWeek(plan, today)
  const week = pack.weeks[weekNo - 1]
  const totals = totalsByDay(sessions)
  const streak = currentStreak(totals, today)
  const minutesToday = Math.round((totals.get(today) ?? 0) / 60)
  const target = profile.dailyMinutes
  const daysStudied = [...totals.values()].filter((s) => s >= 600).length
  const ticked = new Set(canDo.filter((c) => c.week === weekNo).map((c) => c.index))
  const benchmarkRound = ROUNDS.includes(weekNo as (typeof ROUNDS)[number]) ? weekNo : null
  const thenAndNowDue = benchmarkRound !== null && phase.kind === 'week' && !recordings.some((r) => r.kind === 'benchmark' && (r.round ?? 1) === benchmarkRound)
  const resumable = sessions
    .filter((s) => isResumable(s, today))
    .sort((a, b) => b.startedAt - a.startedAt)[0]
  const backupDue = !settings.lastBackupAt || Date.now() - settings.lastBackupAt > BACKUP_REMINDER_DAYS * 86_400_000

  const heading =
    phase.kind === 'before'
      ? `${APP_NAME} starts in ${phase.daysUntil} day${phase.daysUntil === 1 ? '' : 's'}`
      : phase.kind === 'week'
        ? `Week ${phase.week} · Day ${phase.dayOfProgram}`
        : phase.kind === 'final'
          ? `Final stretch · Day ${phase.dayOfProgram}`
          : 'Programme complete!'

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>{format(fromDayKey(today), 'EEEE d MMMM')}</Eyebrow>
          <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">{heading}</h1>
          {phase.kind !== 'before' && phase.kind !== 'after' && (
            <p className="mt-1 font-semibold text-muted">
              {PROGRAM_DAYS - phase.dayOfProgram} days to go in your {PROGRAM_DAYS}-day programme
            </p>
          )}
        </div>
        <StreakBadge days={streak} size="lg" />
      </header>

      {!profile.seedApprovedAt && (
        <Notice tone="warn" icon={<Sparkles size={20} />}>
          One thing first:{' '}
          <Link to="/course" className="underline decoration-2 underline-offset-2">
            review and approve your course
          </Link>
          .
        </Notice>
      )}

      {resumable && (
        <Card className="pop-in flex flex-col gap-4 border-accent bg-accent-soft sm:flex-row sm:items-center">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent">
            <History size={28} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-black">Pick up where you left off</p>
            <p className="text-sm font-semibold text-muted">
              {resumable.mode}-minute session · stage {(resumable.currentIndex ?? 0) + 1} of {resumable.stages.length}:{' '}
              {STAGE_INFO[resumable.stages[resumable.currentIndex ?? 0].stage].title} ·{' '}
              {formatDuration(resumable.stages.reduce((n, l) => n + l.actualSec, 0))} done
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => db.sessions.update(resumable.id, { currentIndex: resumable.stages.length })}
              aria-label="Dismiss: don't resume this session"
            >
              Dismiss
            </Button>
            <Button variant="primary" icon={<Play size={18} fill="currentColor" />} onClick={() => navigate(`/session?resume=${resumable.id}`)}>
              Resume
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Hero: today's session */}
        <Card className="relative overflow-hidden lg:col-span-3">
          <div className="pointer-events-none absolute -top-16 -right-16 hidden h-56 w-56 rounded-full bg-accent-soft sm:block" aria-hidden />
          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <ProgressRing value={minutesToday} max={target} size={148} stroke={14} label={`${minutesToday} of ${target} minutes today`}>
              <div>
                <p className="text-4xl font-black leading-none">{minutesToday}</p>
                <p className="mt-1 text-xs font-extrabold text-muted">of {target} min</p>
              </div>
            </ProgressRing>
            <div className="w-full min-w-0 flex-1 space-y-4">
              <div>
                <Eyebrow>Today's session</Eyebrow>
                <p className="mt-1 text-2xl font-black leading-tight">
                  {minutesToday >= target ? 'Goal reached. Bravo!' : 'Ready to talk?'}
                </p>
              </div>
              <Segmented
                label="Session length"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 10, label: '10' },
                  { value: 30, label: '30' },
                  { value: 45, label: '45' },
                  { value: 60, label: '60 min' },
                ]}
              />
              <Button
                variant="primary"
                size="xl"
                className="w-full"
                icon={<Play size={24} fill="currentColor" />}
                disabled={!approved}
                onClick={() => navigate(`/session?mode=${mode}`)}
              >
                {minutesToday > 0 ? 'Start another session' : 'Start session'}
              </Button>
              <p className="text-center text-xs font-bold text-muted">
                {!approved
                  ? 'Approve your course to start.'
                  : mode === 10
                    ? 'Short on time: review + speak. Still counts for your streak.'
                    : `${mode} minutes, ${mode === 30 ? 'four' : 'five'} stages. Skip or extend any of them.`}
              </p>
            </div>
          </div>
        </Card>

        {/* This week's station */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <Eyebrow className="text-rouge">Station {week.week} of {CURRICULUM_WEEKS}</Eyebrow>
            <Link to="/course" className="flex items-center text-sm font-extrabold text-accent">
              Line <ChevronRight size={18} />
            </Link>
          </div>
          <h2 className="mt-1 text-xl font-black leading-snug">{week.theme}</h2>
          <p className="text-sm font-semibold text-muted">{week.grammar}</p>
          <div className="my-5">
            <MetroLineCompact total={CURRICULUM_WEEKS} current={phase.kind === 'before' ? 0.5 : weekNo} />
          </div>
          <div className="mb-2 flex items-center justify-between">
            <Eyebrow>Goals to earn this week</Eyebrow>
            <Link to="/weekly-review" className="text-xs font-extrabold text-accent">
              Tick goals
            </Link>
          </div>
          <ul className="space-y-2">
            {week.canDo.map((c, i) => {
              const done = ticked.has(i)
              return (
                <li key={c} className="flex items-start gap-3">
                  <span
                    className={
                      done
                        ? 'grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold text-[#3d2a00]'
                        : 'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-dashed border-line text-muted'
                    }
                    aria-hidden
                  >
                    <Award size={16} strokeWidth={2.6} />
                  </span>
                  <span className={done ? 'text-sm font-bold' : 'text-sm font-semibold text-muted'}>{c}</span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <ResumeShadowing />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPill icon={<Layers size={22} />} value={stats ? stats.dueReviews + stats.newAvailable : '–'} label="Phrases for today" />
        <StatPill icon={<Mic size={22} />} value={formatDuration(speakingSeconds(recordings, conversations))} label="Spoken on record" tone="rouge" />
        <StatPill icon={<CalendarCheck size={22} />} value={daysStudied} label="Days studied" tone="good" />
        <StatPill icon={<Award size={22} />} value={canDo.length} label="Goals earned" tone="gold" />
      </div>

      {isReviewDay(plan, today) && (
        <Notice icon={<CalendarCheck size={20} />}>
          Sunday: your weekly review is due.{' '}
          <Link to="/weekly-review" className="underline decoration-2 underline-offset-2">
            Do it now (5 minutes)
          </Link>
        </Notice>
      )}
      {thenAndNowDue && (
        <Notice icon={<History size={20} />}>
          This is a "Then and now" week: record the three benchmark prompts so you can hear your progress later.{' '}
          <Link to="/then-and-now" className="underline decoration-2 underline-offset-2">
            Record them
          </Link>
        </Notice>
      )}
      {(phase.kind === 'final' || (phase.kind === 'week' && phase.week === 12)) && !profile.finalCheckAt && (
        <Notice tone="good" icon={<Award size={20} />}>
          Final stretch: time for your 10-minute fluency check.{' '}
          <Link to="/fluency-check" className="underline decoration-2 underline-offset-2">
            Start it
          </Link>
        </Notice>
      )}

      {backupDue && (
        <Notice tone="warn" icon={<ShieldAlert size={20} />}>
          {settings.lastBackupAt ? "It's been over a week since your last backup." : "You haven't backed up yet."}{' '}
          <Link to="/settings" className="underline decoration-2 underline-offset-2">
            Back up now
          </Link>
        </Notice>
      )}
    </div>
  )
}
