import { addDays, format } from 'date-fns'
import { fromDayKey, type DayKey } from './program'

// Streak rules (agreed): a day counts if you studied at least 10 minutes in total that day
// (any session length counts, including the 10-minute mode). Days end at local midnight.
// A streak is still alive today if yesterday counted, even before today's session.

export const STREAK_MIN_SECONDS = 10 * 60

export interface DayTotal {
  day: DayKey
  seconds: number
}

/** Total study seconds per day from session rows. */
export function totalsByDay(sessions: { day: DayKey; stages: { actualSec: number }[] }[]): Map<DayKey, number> {
  const m = new Map<DayKey, number>()
  for (const s of sessions) {
    const secs = s.stages.reduce((n, st) => n + st.actualSec, 0)
    m.set(s.day, (m.get(s.day) ?? 0) + secs)
  }
  return m
}

const prev = (k: DayKey) => format(addDays(fromDayKey(k), -1), 'yyyy-MM-dd')

export function currentStreak(totals: Map<DayKey, number>, today: DayKey): number {
  const counts = (d: DayKey) => (totals.get(d) ?? 0) >= STREAK_MIN_SECONDS
  let day = counts(today) ? today : prev(today)
  let n = 0
  while (counts(day)) {
    n++
    day = prev(day)
  }
  return n
}

export function longestStreak(totals: Map<DayKey, number>): number {
  const days = [...totals.entries()].filter(([, s]) => s >= STREAK_MIN_SECONDS).map(([d]) => d).sort()
  let best = 0
  let run = 0
  let last: DayKey | null = null
  for (const d of days) {
    run = last && prev(d) === last ? run + 1 : 1
    best = Math.max(best, run)
    last = d
  }
  return best
}
