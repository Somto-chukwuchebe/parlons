import {
  createSession,
  current,
  extend,
  finishEarly,
  isFinished,
  isOvertime,
  next,
  plannedTotalSec,
  remainingSec,
  skip,
  speakingSec,
  STAGE_PLANS,
  tick,
  toStageLogs,
  totalSec,
} from './session'

describe('session timing', () => {
  it('plans add up to the chosen length', () => {
    for (const mode of [10, 30, 45, 60] as const) {
      expect(plannedTotalSec(createSession(mode))).toBe(mode * 60)
    }
  })

  it('10-minute mode is Review 4 + Speak 6', () => {
    const s = createSession(10)
    expect(s.stages.map((x) => [x.stage, x.plannedSec / 60])).toEqual([
      ['review', 4],
      ['speak', 6],
    ])
  })

  it('30-minute mode has no conversation stage; 45 and 60 do', () => {
    expect(STAGE_PLANS[30].map(([s]) => s)).not.toContain('conversation')
    expect(STAGE_PLANS[45].map(([s]) => s)).toContain('conversation')
    expect(STAGE_PLANS[60].map(([s]) => s)).toContain('conversation')
  })

  it('tracks time and never auto-advances', () => {
    let s = createSession(30)
    s = tick(s, 5 * 60 + 30)
    expect(s.index).toBe(0)
    expect(isOvertime(current(s)!)).toBe(true)
    expect(remainingSec(current(s)!)).toBe(0)
  })

  it('extending adds time to the current stage only', () => {
    let s = createSession(30)
    s = tick(s, 4 * 60)
    s = extend(s)
    expect(current(s)!.plannedSec).toBe(7 * 60)
    expect(remainingSec(current(s)!)).toBe(3 * 60)
    expect(s.stages[1].plannedSec).toBe(10 * 60)
  })

  it('skipping logs the time already spent and marks the stage skipped', () => {
    let s = createSession(30)
    s = tick(s, 90)
    s = skip(s)
    expect(current(s)!.stage).toBe('structure')
    const logs = toStageLogs(s)
    expect(logs[0]).toEqual({ stage: 'review', plannedSec: 300, actualSec: 90, skipped: true })
  })

  it('logs actual minutes per stage through a full session with skip and extend', () => {
    let s = createSession(45)
    s = next(tick(s, 7 * 60)) // review done on time
    s = next(tick(extend(s), 14 * 60)) // structure extended to 14
    s = skip(s) // shadowing skipped untouched
    s = next(tick(s, 10 * 60)) // speak
    s = next(tick(s, 8 * 60)) // conversation, a bit over
    expect(isFinished(s)).toBe(true)
    expect(toStageLogs(s).map((l) => [l.stage, l.actualSec / 60, l.skipped])).toEqual([
      ['review', 7, false],
      ['structure', 14, false],
      ['shadowing', 0, true],
      ['speak', 10, false],
      ['conversation', 8, false],
    ])
    expect(totalSec(s)).toBe(39 * 60)
    expect(speakingSec(s)).toBe(18 * 60)
  })

  it('finishing early keeps the current stage and skips the rest', () => {
    let s = createSession(60)
    s = next(tick(s, 8 * 60))
    s = tick(s, 3 * 60)
    s = finishEarly(s)
    expect(isFinished(s)).toBe(true)
    const logs = toStageLogs(s)
    expect(logs[1]).toMatchObject({ stage: 'structure', actualSec: 180, skipped: false })
    expect(logs.slice(2).every((l) => l.skipped && l.actualSec === 0)).toBe(true)
  })

  it('ignores ticks after the session is finished', () => {
    let s = finishEarly(createSession(10))
    s = tick(s, 100)
    expect(totalSec(s)).toBe(0)
  })
})
