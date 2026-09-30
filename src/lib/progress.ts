import { addDays, format } from 'date-fns'
import { State } from 'ts-fsrs'
import type { CardRow, ConversationRow, MistakeRow, RecordingRow, ReviewLogRow, SessionRow, StageId, WeeklyReviewRow } from '../db/schema'
import { fromDayKey, type DayKey, type ProgramPlan } from './program'
import { speakingSeconds } from './stats'
import { totalsByDay } from './streak'

// Numbers for the progress dashboard and the weekly review. Pure functions, easy to test.

/** A card counts as learned once FSRS expects you to remember it for 3+ weeks. */
export const LEARNED_STABILITY_DAYS = 21

export interface HeatCell {
  day: DayKey
  minutes: number
  level: 0 | 1 | 2 | 3 | 4 // 0 none, 1 <10 min, 2 ≥10, 3 ≥ half target, 4 ≥ target
  future: boolean
}

/** One cell per programme day, coloured by minutes studied vs the daily target. */
export function heatmap(plan: ProgramPlan, sessions: Pick<SessionRow, 'day' | 'stages'>[], target: number, today: DayKey): HeatCell[] {
  const totals = totalsByDay(sessions)
  const cells: HeatCell[] = []
  for (let d = fromDayKey(plan.start); format(d, 'yyyy-MM-dd') <= plan.end; d = addDays(d, 1)) {
    const day = format(d, 'yyyy-MM-dd')
    const minutes = Math.round((totals.get(day) ?? 0) / 60)
    const level = minutes === 0 ? 0 : minutes < 10 ? 1 : minutes < target / 2 ? 2 : minutes < target ? 3 : 4
    cells.push({ day, minutes, level, future: day > today })
  }
  return cells
}

export function minutesByStage(sessions: Pick<SessionRow, 'stages'>[]): Record<StageId, number> {
  const out: Record<StageId, number> = { review: 0, structure: 0, shadowing: 0, speak: 0, conversation: 0 }
  for (const s of sessions) for (const st of s.stages) out[st.stage] += st.actualSec / 60
  for (const k of Object.keys(out) as StageId[]) out[k] = Math.round(out[k])
  return out
}

/**
 * Retention: of reviews of cards you'd already learned (not first sightings),
 * the share you didn't press "Again" on. The honest measure of whether review works.
 */
export function retentionRate(logs: Pick<ReviewLogRow, 'state' | 'rating'>[]): number | null {
  const reviews = logs.filter((l) => l.state === State.Review)
  if (reviews.length < 5) return null
  return reviews.filter((l) => l.rating > 1).length / reviews.length
}

export function phraseCounts(cards: Pick<CardRow, 'fsrs' | 'due' | 'suspended'>[], now = Date.now()) {
  const active = cards.filter((c) => !c.suspended)
  return {
    total: active.length,
    learned: active.filter((c) => c.fsrs.stability >= LEARNED_STABILITY_DAYS).length,
    started: active.filter((c) => c.fsrs.state !== State.New).length,
    due: active.filter((c) => c.fsrs.state !== State.New && c.due <= now).length,
  }
}

export function speakingMetrics(recordings: Pick<RecordingRow, 'durationSec' | 'wpm'>[], conversations: Pick<ConversationRow, 'kind' | 'durationMin' | 'avgWordsPerTurn'>[]) {
  const wpms = recordings.map((r) => r.wpm).filter((w): w is number => !!w)
  const turns = conversations.map((c) => c.avgWordsPerTurn).filter((w): w is number => !!w)
  const people = conversations.filter((c) => c.kind === 'tutor' || c.kind === 'exchange')
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null)
  return {
    totalMinutes: Math.round(speakingSeconds(recordings, conversations) / 60),
    recordedMinutes: Math.round(recordings.reduce((n, r) => n + r.durationSec, 0) / 60),
    avgWpm: avg(wpms),
    avgWordsPerTurn: avg(turns),
    longestConversation: conversations.reduce((m, c) => Math.max(m, c.durationMin), 0),
    calls: people.length,
    callMinutes: people.reduce((n, c) => n + c.durationMin, 0),
  }
}

export interface WeekStat {
  week: number
  start: DayKey
  end: DayKey
  studyMinutes: number
  speakingMinutes: number
  mistakes: number
  selfRating?: number
  confidence?: number
}

/** Per curriculum week: study time, speaking time, mistakes and the weekly check-in ratings. */
export function weeklyStats(
  plan: ProgramPlan,
  data: {
    sessions: Pick<SessionRow, 'day' | 'stages'>[]
    recordings: Pick<RecordingRow, 'day' | 'durationSec'>[]
    conversations: Pick<ConversationRow, 'day' | 'durationMin'>[]
    mistakes: Pick<MistakeRow, 'day'>[]
    reviews: Pick<WeeklyReviewRow, 'week' | 'selfRating' | 'confidence'>[]
  },
): WeekStat[] {
  const within = (d: DayKey, s: DayKey, e: DayKey) => d >= s && d <= e
  return plan.weeks.map((w) => {
    const sessions = data.sessions.filter((s) => within(s.day, w.start, w.end))
    const rec = data.recordings.filter((r) => within(r.day, w.start, w.end))
    const conv = data.conversations.filter((c) => within(c.day, w.start, w.end))
    const review = data.reviews.find((r) => r.week === w.week)
    return {
      week: w.week,
      start: w.start,
      end: w.end,
      studyMinutes: Math.round(sessions.reduce((n, s) => n + s.stages.reduce((m, st) => m + st.actualSec, 0), 0) / 60),
      speakingMinutes: Math.round(speakingSeconds(rec, conv) / 60),
      mistakes: data.mistakes.filter((m) => within(m.day, w.start, w.end)).length,
      selfRating: review?.selfRating,
      confidence: review?.confidence,
    }
  })
}
