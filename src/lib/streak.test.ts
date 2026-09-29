import { currentStreak, longestStreak, totalsByDay, STREAK_MIN_SECONDS } from './streak'

const s = (day: string, ...secs: number[]) => ({ day, stages: secs.map((actualSec) => ({ actualSec })) })
const MIN = STREAK_MIN_SECONDS

describe('streaks', () => {
  it('sums all sessions on a day', () => {
    const t = totalsByDay([s('2026-10-01', 300, 200), s('2026-10-01', 200)])
    expect(t.get('2026-10-01')).toBe(700)
  })

  it('counts consecutive days ending today', () => {
    const t = totalsByDay([s('2026-10-01', MIN), s('2026-10-02', MIN), s('2026-10-03', MIN)])
    expect(currentStreak(t, '2026-10-03')).toBe(3)
  })

  it('keeps the streak alive today if yesterday counted', () => {
    const t = totalsByDay([s('2026-10-01', MIN), s('2026-10-02', MIN)])
    expect(currentStreak(t, '2026-10-03')).toBe(2)
  })

  it('breaks after a missed day', () => {
    const t = totalsByDay([s('2026-10-01', MIN), s('2026-10-03', MIN)])
    expect(currentStreak(t, '2026-10-04')).toBe(1)
    expect(currentStreak(t, '2026-10-05')).toBe(0)
  })

  it('a 10-minute short session counts; less does not', () => {
    const t = totalsByDay([s('2026-10-01', 4 * 60, 6 * 60), s('2026-10-02', MIN - 1)])
    expect(currentStreak(t, '2026-10-01')).toBe(1)
    expect(currentStreak(t, '2026-10-02')).toBe(1) // today not reached yet; yesterday still counts
    expect(currentStreak(t, '2026-10-03')).toBe(0)
  })

  it('handles month boundaries and finds the longest run', () => {
    const t = totalsByDay([s('2026-10-30', MIN), s('2026-10-31', MIN), s('2026-11-01', MIN), s('2026-11-05', MIN)])
    expect(currentStreak(t, '2026-11-01')).toBe(3)
    expect(longestStreak(t)).toBe(3)
  })
})
