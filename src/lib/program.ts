import { addDays, differenceInCalendarDays, format, getISODay, parseISO } from 'date-fns'
import { CURRICULUM_WEEKS, PROGRAM_DAYS } from '../config'

// The programme calendar.
//
// Rules (agreed with the learner):
// - The programme lasts PROGRAM_DAYS days from the start date.
// - Weekly reviews always fall on Sundays, so weeks 2–12 run Monday → Sunday.
// - Week 1 absorbs the mismatch:
//     start Mon            → normal week 1 (7 days)
//     start Tue–Wed        → short week 1 (ends that Sunday, 5–6 days)
//     start Thu–Sun        → long week 1 (ends the *following* Sunday, 8–11 days)
// - Days left after week 12 form the "final stretch" (2–8 days).

/** Dates are handled as local calendar days in 'yyyy-MM-dd' form. */
export type DayKey = string

export const toDayKey = (d: Date): DayKey => format(d, 'yyyy-MM-dd')
export const fromDayKey = (k: DayKey): Date => parseISO(k)

export interface WeekSpan {
  week: number // 1..12
  start: DayKey
  end: DayKey // always a Sunday
  days: number
}

export interface ProgramPlan {
  start: DayKey
  end: DayKey // last day (day PROGRAM_DAYS)
  weeks: WeekSpan[]
  finalStretch: { start: DayKey; end: DayKey; days: number }
}

export function week1Length(start: Date): number {
  const iso = getISODay(start) // 1 = Mon … 7 = Sun
  const toSunday = 7 - iso // days after start until this week's Sunday
  return iso <= 3 ? toSunday + 1 : toSunday + 8
}

export function buildPlan(startKey: DayKey): ProgramPlan {
  const start = fromDayKey(startKey)
  const weeks: WeekSpan[] = []
  const w1 = week1Length(start)
  weeks.push({ week: 1, start: startKey, end: toDayKey(addDays(start, w1 - 1)), days: w1 })
  let cursor = addDays(start, w1) // a Monday
  for (let w = 2; w <= CURRICULUM_WEEKS; w++) {
    weeks.push({ week: w, start: toDayKey(cursor), end: toDayKey(addDays(cursor, 6)), days: 7 })
    cursor = addDays(cursor, 7)
  }
  const end = addDays(start, PROGRAM_DAYS - 1)
  return {
    start: startKey,
    end: toDayKey(end),
    weeks,
    finalStretch: {
      start: toDayKey(cursor),
      end: toDayKey(end),
      days: differenceInCalendarDays(end, cursor) + 1,
    },
  }
}

export type Phase =
  | { kind: 'before'; daysUntil: number }
  | { kind: 'week'; week: number; dayOfProgram: number; span: WeekSpan }
  | { kind: 'final'; dayOfProgram: number; daysLeft: number }
  | { kind: 'after'; daysSince: number }

/** Where `today` falls in the programme. */
export function phaseOn(plan: ProgramPlan, today: DayKey): Phase {
  const t = fromDayKey(today)
  const s = fromDayKey(plan.start)
  const dayOfProgram = differenceInCalendarDays(t, s) + 1
  if (dayOfProgram < 1) return { kind: 'before', daysUntil: 1 - dayOfProgram }
  if (dayOfProgram > PROGRAM_DAYS) return { kind: 'after', daysSince: dayOfProgram - PROGRAM_DAYS }
  const span = plan.weeks.find((w) => today >= w.start && today <= w.end)
  if (span) return { kind: 'week', week: span.week, dayOfProgram, span }
  return { kind: 'final', dayOfProgram, daysLeft: PROGRAM_DAYS - dayOfProgram }
}

/** The curriculum week whose content applies today (final stretch → week 12, before → week 1). */
export function contentWeek(plan: ProgramPlan, today: DayKey): number {
  const p = phaseOn(plan, today)
  if (p.kind === 'week') return p.week
  if (p.kind === 'before') return 1
  return CURRICULUM_WEEKS
}

/** Weekly review is due on Sundays that end a curriculum week, and on the last programme day. */
export function isReviewDay(plan: ProgramPlan, today: DayKey): boolean {
  return plan.weeks.some((w) => w.end === today) || plan.end === today
}
