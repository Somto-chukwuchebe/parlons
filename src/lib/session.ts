import type { SessionMode, StageId, StageLog } from '../db/schema'

// The guided session as a small, pure state machine (easy to test).
// The UI calls tick() with real elapsed time, and next/skip/extend from buttons.
// Stages never auto-advance: when time is up the player chimes and waits for you.

export const STAGE_PLANS: Record<SessionMode, [StageId, number][]> = {
  10: [
    ['review', 4],
    ['speak', 6],
  ],
  30: [
    ['review', 5],
    ['structure', 10],
    ['shadowing', 7],
    ['speak', 8],
  ],
  45: [
    ['review', 7],
    ['structure', 12],
    ['shadowing', 9],
    ['speak', 10],
    ['conversation', 7],
  ],
  60: [
    ['review', 8],
    ['structure', 15],
    ['shadowing', 12],
    ['speak', 15],
    ['conversation', 10],
  ],
}

export const STAGE_INFO: Record<StageId, { title: string; blurb: string }> = {
  review: { title: 'Review', blurb: 'Say each phrase out loud first, then check and grade yourself.' },
  structure: { title: 'Structure', blurb: "This week's pattern, with model sentences to say aloud." },
  shadowing: { title: 'Shadowing', blurb: 'Listen, then speak along with the audio. Copy the rhythm.' },
  speak: { title: 'Speak', blurb: 'Answer prompts out loud while the app records you.' },
  conversation: { title: 'Conversation', blurb: 'Log a call with a tutor or partner, or talk to yourself.' },
}

/** Stages that count as speaking practice time. */
export const SPEAKING_STAGES: StageId[] = ['shadowing', 'speak', 'conversation']

export const EXTEND_SEC = 2 * 60

export interface StageState {
  stage: StageId
  plannedSec: number
  elapsedSec: number
  status: 'pending' | 'active' | 'done' | 'skipped'
  /** Set while revisiting a finished stage: its status before you went back to it. */
  wasStatus?: 'done' | 'skipped'
}

export interface SessionState {
  mode: SessionMode
  stages: StageState[]
  index: number // current stage; === stages.length when finished
}

export function createSession(mode: SessionMode): SessionState {
  return {
    mode,
    index: 0,
    stages: STAGE_PLANS[mode].map(([stage, min], i) => ({
      stage,
      plannedSec: min * 60,
      elapsedSec: 0,
      status: i === 0 ? 'active' : 'pending',
    })),
  }
}

export const isFinished = (s: SessionState) => s.index >= s.stages.length
export const current = (s: SessionState): StageState | undefined => s.stages[s.index]
export const remainingSec = (st: StageState) => Math.max(0, st.plannedSec - st.elapsedSec)
export const isOvertime = (st: StageState) => st.elapsedSec >= st.plannedSec

function update(s: SessionState, i: number, patch: Partial<StageState>): StageState[] {
  return s.stages.map((st, j) => (j === i ? { ...st, ...patch } : st))
}

/** The stage to go to next: the first unfinished one after `from`, else any unfinished one. */
function nextUnfinished(stages: StageState[], from: number): number {
  const after = stages.findIndex((st, j) => j > from && st.status === 'pending')
  if (after !== -1) return after
  const any = stages.findIndex((st) => st.status === 'pending')
  return any === -1 ? stages.length : any
}

function advance(s: SessionState, status: 'done' | 'skipped'): SessionState {
  if (isFinished(s)) return s
  const cur = s.stages[s.index]
  // Skipping a stage you went back to leaves it as it was; finishing it marks it done.
  const finalStatus = status === 'skipped' && cur.wasStatus ? cur.wasStatus : status
  let stages = update(s, s.index, { status: finalStatus, wasStatus: undefined })
  const index = nextUnfinished(stages, s.index)
  if (index < stages.length) stages = stages.map((st, j) => (j === index ? { ...st, status: 'active' } : st))
  return { ...s, stages, index }
}

/** Where "Next stage" will go (stages.length = the session ends). */
export const upcomingIndex = (s: SessionState) => nextUnfinished(s.stages.map((st, j) => (j === s.index ? { ...st, status: 'done' as const } : st)), s.index)

/** Stages you can jump back to: any you've already finished or skipped. */
export const canGoTo = (s: SessionState, target: number) =>
  !isFinished(s) && target !== s.index && (s.stages[target]?.status === 'done' || s.stages[target]?.status === 'skipped')

/**
 * Go back to an earlier (finished or skipped) stage. Time then counts towards that stage.
 * The stage you leave keeps its time: if you hadn't finished it, it's waiting for you,
 * and "Next stage" from the revisited stage brings you back to it.
 */
export function goTo(s: SessionState, target: number): SessionState {
  if (!canGoTo(s, target)) return s
  const cur = s.stages[s.index]
  const stages = s.stages.map((st, j) => {
    if (j === s.index) return { ...st, status: cur.wasStatus ?? ('pending' as const), wasStatus: undefined }
    if (j === target) return { ...st, status: 'active' as const, wasStatus: st.status as 'done' | 'skipped' }
    return st
  })
  return { ...s, stages, index: target }
}

/** Add real elapsed seconds to the current stage. */
export function tick(s: SessionState, seconds: number): SessionState {
  const st = current(s)
  if (!st || seconds <= 0) return s
  return { ...s, stages: update(s, s.index, { elapsedSec: st.elapsedSec + seconds }) }
}

/** Finish the current stage and move on. */
export const next = (s: SessionState) => advance(s, 'done')

/** Skip the current stage (any time already spent is still logged). */
export const skip = (s: SessionState) => advance(s, 'skipped')

/** Give the current stage more time. */
export function extend(s: SessionState, seconds = EXTEND_SEC): SessionState {
  const st = current(s)
  if (!st) return s
  return { ...s, stages: update(s, s.index, { plannedSec: st.plannedSec + seconds }) }
}

/** End the whole session now: the current stage counts as done, later ones as skipped. */
export function finishEarly(s: SessionState): SessionState {
  if (isFinished(s)) return s
  const stages = s.stages.map((st, j) =>
    j === s.index ? { ...st, status: 'done' as const, wasStatus: undefined } : st.status === 'pending' ? { ...st, status: 'skipped' as const } : st,
  )
  return { ...s, stages, index: stages.length }
}

/** Rebuild a session from what was saved, to resume it. */
export function restoreSession(mode: SessionMode, logs: StageLog[], index: number): SessionState {
  const fresh = createSession(mode)
  const i = Math.max(0, Math.min(index, fresh.stages.length))
  return {
    mode,
    index: i,
    stages: fresh.stages.map((st, j) => {
      const log = logs.find((l) => l.stage === st.stage)
      return {
        ...st,
        plannedSec: log?.plannedSec ?? st.plannedSec,
        elapsedSec: log?.actualSec ?? 0,
        // Newer saves record each stage's status; older ones are inferred from position.
        status: j === i ? 'active' : log?.status && log.status !== 'active' ? log.status : j < i ? (log?.skipped ? 'skipped' : 'done') : 'pending',
        // Resuming while revisiting a finished stage: remember it was finished.
        wasStatus: j === i && (log?.status === 'done' || log?.status === 'skipped') ? log.status : undefined,
      }
    }),
  }
}

/** Resume only a session from today that has started and isn't finished. */
export function isResumable(row: { completed: boolean; day: string; currentIndex?: number; stages: StageLog[] }, today: string) {
  const spent = row.stages.reduce((n, l) => n + l.actualSec, 0)
  return !row.completed && row.day === today && row.currentIndex !== undefined && row.currentIndex < row.stages.length && spent >= 30
}

/** What gets saved: actual seconds per stage. */
export function toStageLogs(s: SessionState): StageLog[] {
  return s.stages.map((st) => ({
    stage: st.stage,
    plannedSec: st.plannedSec,
    actualSec: Math.round(st.elapsedSec),
    skipped: st.status === 'skipped' || (st.status === 'pending' && st.elapsedSec === 0),
    status: st.status === 'active' && st.wasStatus ? st.wasStatus : st.status,
  }))
}

export const totalSec = (s: SessionState) => s.stages.reduce((n, st) => n + st.elapsedSec, 0)
export const plannedTotalSec = (s: SessionState) => s.stages.reduce((n, st) => n + st.plannedSec, 0)
export const speakingSec = (s: SessionState) =>
  s.stages.filter((st) => SPEAKING_STAGES.includes(st.stage)).reduce((n, st) => n + st.elapsedSec, 0)

export function formatClock(sec: number) {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** "45 sec", "12 min" — honest for short sessions too. */
export function formatDuration(sec: number) {
  const s = Math.round(sec)
  return s < 60 ? `${s} sec` : `${Math.round(s / 60)} min`
}
