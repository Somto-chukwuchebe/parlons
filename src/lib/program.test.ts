import { buildPlan, contentWeek, isReviewDay, phaseOn, week1Length } from './program'
import { fromDayKey } from './program'
import { getISODay } from 'date-fns'

describe('programme calendar', () => {
  it.each([
    ['2026-09-28', 'Mon', 7],
    ['2026-09-29', 'Tue', 6],
    ['2026-09-30', 'Wed', 5],
    ['2026-10-01', 'Thu', 11],
    ['2026-10-02', 'Fri', 10],
    ['2026-10-03', 'Sat', 9],
    ['2026-10-04', 'Sun', 8],
  ])('start %s (%s) gives a %i-day week 1', (start, _day, len) => {
    expect(week1Length(fromDayKey(start))).toBe(len)
  })

  it('builds the agreed plan for a Thursday 1 Oct 2026 start', () => {
    const plan = buildPlan('2026-10-01')
    expect(plan.weeks[0]).toMatchObject({ start: '2026-10-01', end: '2026-10-11', days: 11 })
    expect(plan.weeks[1]).toMatchObject({ start: '2026-10-12', end: '2026-10-18' })
    expect(plan.weeks[11]).toMatchObject({ week: 12, start: '2026-12-21', end: '2026-12-27' })
    expect(plan.end).toBe('2026-12-29')
    expect(plan.finalStretch).toEqual({ start: '2026-12-28', end: '2026-12-29', days: 2 })
  })

  it('always has 12 weeks ending on Sundays and 90 days in total', () => {
    for (let d = 1; d <= 14; d++) {
      const start = `2026-10-${String(d).padStart(2, '0')}`
      const plan = buildPlan(start)
      expect(plan.weeks).toHaveLength(12)
      for (const w of plan.weeks) expect(getISODay(fromDayKey(w.end))).toBe(7)
      const total = plan.weeks.reduce((n, w) => n + w.days, 0) + plan.finalStretch.days
      expect(total).toBe(90)
      expect(plan.finalStretch.days).toBeGreaterThanOrEqual(2)
      expect(plan.finalStretch.days).toBeLessThanOrEqual(8)
    }
  })

  it('knows where a day falls', () => {
    const plan = buildPlan('2026-10-01')
    expect(phaseOn(plan, '2026-09-29')).toEqual({ kind: 'before', daysUntil: 2 })
    expect(phaseOn(plan, '2026-10-01')).toMatchObject({ kind: 'week', week: 1, dayOfProgram: 1 })
    expect(phaseOn(plan, '2026-10-12')).toMatchObject({ kind: 'week', week: 2, dayOfProgram: 12 })
    expect(phaseOn(plan, '2026-12-28')).toMatchObject({ kind: 'final', dayOfProgram: 89, daysLeft: 1 })
    expect(phaseOn(plan, '2026-12-30')).toEqual({ kind: 'after', daysSince: 1 })
    expect(contentWeek(plan, '2026-12-29')).toBe(12)
    expect(contentWeek(plan, '2026-09-01')).toBe(1)
  })

  it('puts weekly reviews on Sundays and the last day', () => {
    const plan = buildPlan('2026-10-01')
    expect(isReviewDay(plan, '2026-10-04')).toBe(false) // first Sunday falls inside the long week 1
    expect(isReviewDay(plan, '2026-10-11')).toBe(true)
    expect(isReviewDay(plan, '2026-10-18')).toBe(true)
    expect(isReviewDay(plan, '2026-12-29')).toBe(true)
  })
})
