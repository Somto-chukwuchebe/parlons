import {
  upcomingIndex,
  canGoTo,
  goTo,
  createSession,
  isResumable,
  restoreSession,
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
    expect(logs[0]).toMatchObject({ stage: 'review', plannedSec: 300, actualSec: 90, skipped: true, status: 'skipped' })
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

  it('restores a saved session at the same stage with its time', () => {
    let s = createSession(45)
    s = next(tick(s, 7 * 60)) // review done
    s = skip(tick(s, 60)) // structure skipped after 1 min
    s = tick(extend(s), 4 * 60) // shadowing in progress, extended
    const restored = restoreSession(45, toStageLogs(s), s.index)
    expect(restored.index).toBe(2)
    expect(restored.stages.map((x) => x.status)).toEqual(['done', 'skipped', 'active', 'pending', 'pending'])
    expect(current(restored)!.elapsedSec).toBe(4 * 60)
    expect(current(restored)!.plannedSec).toBe(11 * 60)
    expect(totalSec(restored)).toBe(totalSec(s))
  })

  it('offers resume only for today, unfinished sessions with some time spent', () => {
    const s = tick(createSession(30), 120)
    const row = { completed: false, day: '2026-10-01', currentIndex: 0, stages: toStageLogs(s) }
    expect(isResumable(row, '2026-10-01')).toBe(true)
    expect(isResumable(row, '2026-10-02')).toBe(false)
    expect(isResumable({ ...row, completed: true }, '2026-10-01')).toBe(false)
    expect(isResumable({ ...row, stages: toStageLogs(tick(createSession(30), 5)) }, '2026-10-01')).toBe(false)
  })

  it('goes back to an earlier stage, logs time there, and Next returns to where you were', () => {
    let s = createSession(30) // review, structure, shadowing, speak
    s = next(tick(s, 300)) // review done
    s = next(tick(s, 600)) // structure done
    s = tick(s, 120) // 2 min into shadowing
    expect(canGoTo(s, 0)).toBe(true)
    expect(canGoTo(s, 3)).toBe(false) // can't jump forward to an unstarted stage
    s = goTo(s, 1) // back to structure
    expect(upcomingIndex(s)).toBe(2) // Next will return to shadowing
    expect(current(s)!.stage).toBe('structure')
    expect(s.stages[2].status).toBe('pending') // shadowing waits, keeping its 2 minutes
    s = tick(s, 60)
    s = next(s) // structure done again → back to shadowing, not to review
    expect(current(s)!.stage).toBe('shadowing')
    expect(current(s)!.elapsedSec).toBe(120)
    expect(toStageLogs(s).map((l) => l.actualSec)).toEqual([300, 660, 120, 0])
  })

  it('a skipped stage can be revisited; finishing it marks it done, skipping again keeps it skipped', () => {
    let s = createSession(10) // review, speak
    s = skip(s) // skip review untouched
    s = tick(s, 30)
    s = goTo(s, 0)
    s = skip(tick(s, 10)) // leave review again without finishing
    expect(s.stages[0].status).toBe('skipped')
    expect(current(s)!.stage).toBe('speak')
    s = goTo(s, 0)
    s = next(tick(s, 50))
    expect(s.stages[0].status).toBe('done')
    expect(current(s)!.stage).toBe('speak')
  })

  it('finishing early after going back skips only unstarted stages', () => {
    let s = createSession(30)
    s = next(tick(s, 300))
    s = tick(s, 100) // structure in progress
    s = goTo(s, 0)
    s = finishEarly(s)
    expect(isFinished(s)).toBe(true)
    expect(s.stages.map((x) => x.status)).toEqual(['done', 'skipped', 'skipped', 'skipped'])
    expect(totalSec(s)).toBe(400)
  })

  it('resumes with the right statuses after going back', () => {
    let s = createSession(30)
    s = next(tick(s, 300))
    s = next(tick(s, 300))
    s = tick(s, 60)
    s = goTo(s, 0) // revisiting review; shadowing pending
    const restored = restoreSession(30, toStageLogs(s), s.index)
    expect(restored.stages.map((x) => x.status)).toEqual(['active', 'done', 'pending', 'pending'])
    expect(current(next(restored))!.stage).toBe('shadowing')
  })
})
