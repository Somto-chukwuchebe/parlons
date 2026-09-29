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

function advance(s: SessionState, status: 'done' | 'skipped'): SessionState {
  if (isFinished(s)) return s
  let stages = update(s, s.index, { status })
  const index = s.index + 1
  if (index < stages.length) stages = stages.map((st, j) => (j === index ? { ...st, status: 'active' } : st))
  return { ...s, stages, index }
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
    j === s.index ? { ...st, status: 'done' as const } : j > s.index ? { ...st, status: 'skipped' as const } : st,
  )
  return { ...s, stages, index: stages.length }
}

/** What gets saved: actual seconds per stage. */
export function toStageLogs(s: SessionState): StageLog[] {
  return s.stages.map((st) => ({
    stage: st.stage,
    plannedSec: st.plannedSec,
    actualSec: Math.round(st.elapsedSec),
    skipped: st.status === 'skipped' || (st.status === 'pending' && st.elapsedSec === 0),
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
