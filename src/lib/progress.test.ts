import { createEmptyCard, State } from 'ts-fsrs'
import { buildPlan } from './program'
import { heatmap, minutesByStage, phraseCounts, retentionRate, speakingMetrics, weeklyStats } from './progress'
import { suggestStage, type WeekSignals } from './weekly'
import { buildIcs } from './ics'

const sess = (day: string, ...secs: [string, number][]) => ({ day, stages: secs.map(([stage, actualSec]) => ({ stage: stage as never, plannedSec: 0, actualSec, skipped: false })) })

describe('progress numbers', () => {
  const plan = buildPlan('2026-10-01')

  it('builds a 90-day heatmap graded against the daily target', () => {
    const cells = heatmap(plan, [sess('2026-10-01', ['review', 300]), sess('2026-10-02', ['review', 900]), sess('2026-10-03', ['speak', 1800])], 30, '2026-10-03')
    expect(cells).toHaveLength(90)
    expect(cells.slice(0, 4).map((c) => [c.minutes, c.level, c.future])).toEqual([
      [5, 1, false],
      [15, 3, false],
      [30, 4, false],
      [0, 0, true],
    ])
  })

  it('sums minutes by stage', () => {
    expect(minutesByStage([sess('d', ['review', 300], ['speak', 450]), sess('d', ['speak', 150])])).toMatchObject({ review: 5, speak: 10, structure: 0 })
  })

  it('computes retention only from real reviews, once there are enough', () => {
    const r = (rating: number, state = State.Review) => ({ rating: rating as 1, state })
    expect(retentionRate([r(3), r(3)])).toBeNull()
    expect(retentionRate([r(1), r(3), r(3), r(4), r(2), r(1, State.New), r(1, State.Learning)])).toBe(0.8)
  })

  it('counts learned and due phrases', () => {
    const learned = { ...createEmptyCard(), stability: 30, state: State.Review }
    const due = { ...createEmptyCard(), stability: 2, state: State.Review }
    const counts = phraseCounts(
      [
        { fsrs: learned, due: 2e12 },
        { fsrs: due, due: 0 },
        { fsrs: createEmptyCard(), due: 0 },
        { fsrs: createEmptyCard(), due: 0, suspended: true },
      ],
      1e12,
    )
    expect(counts).toEqual({ total: 3, learned: 1, started: 2, due: 1 })
  })

  it('summarises speaking', () => {
    const m = speakingMetrics(
      [{ durationSec: 60, wpm: 80 }, { durationSec: 120, wpm: 100 }, { durationSec: 60 }],
      [{ kind: 'tutor', durationMin: 45 }, { kind: 'ai-prompt', durationMin: 15, avgWordsPerTurn: 7 }],
    )
    expect(m).toMatchObject({ totalMinutes: 64, recordedMinutes: 4, avgWpm: 90, avgWordsPerTurn: 7, longestConversation: 45, calls: 1, callMinutes: 45 })
  })

  it('splits stats by curriculum week', () => {
    const w = weeklyStats(plan, {
      sessions: [sess('2026-10-05', ['review', 600]), sess('2026-10-12', ['speak', 1200])],
      recordings: [{ day: '2026-10-12', durationSec: 120 }],
      conversations: [],
      mistakes: [{ day: '2026-10-11' }],
      reviews: [{ week: 1, selfRating: 2, confidence: 3 }],
    })
    expect(w[0]).toMatchObject({ week: 1, studyMinutes: 10, mistakes: 1, selfRating: 2 })
    expect(w[1]).toMatchObject({ week: 2, studyMinutes: 20, speakingMinutes: 2 })
  })
})

describe('weekly suggestion', () => {
  const base: WeekSignals = {
    studyMinutes: 200,
    stageMinutes: { review: 40, structure: 60, shadowing: 40, speak: 50, conversation: 10 },
    recordingsCount: 8,
    avgPronunciation: 3.5,
    againRate: 0.15,
    mistakesByCategory: {},
    callsOrRolePlays: 1,
    daysStudied: 6,
  }
  it('asks for consistency first', () => expect(suggestStage({ ...base, daysStudied: 2 }).stage).toBe('review'))
  it('flags a high Again rate', () => expect(suggestStage({ ...base, againRate: 0.4 }).stage).toBe('review'))
  it('pushes speaking when too little of it', () =>
    expect(suggestStage({ ...base, stageMinutes: { ...base.stageMinutes, speak: 10, shadowing: 5, conversation: 0 } }).stage).toBe('speak'))
  it('suggests shadowing for pronunciation', () => expect(suggestStage({ ...base, avgPronunciation: 2.5 }).stage).toBe('shadowing'))
  it('suggests structure for grammar mistakes', () => expect(suggestStage({ ...base, mistakesByCategory: { verb: 3, tense: 2 } }).stage).toBe('structure'))
  it('suggests conversation when there was none', () => expect(suggestStage({ ...base, callsOrRolePlays: 0 }).stage).toBe('conversation'))
  it('gives a reason every time', () => expect(suggestStage(base).reason.length).toBeGreaterThan(10))
})

describe('calendar reminder', () => {
  it('creates a daily event for the programme at the chosen time', () => {
    const ics = buildIcs({ appName: 'Parlons', startDate: '2026-10-01', days: 90, time: '07:30', minutes: 30, url: 'https://example.com/parlons/', now: new Date('2026-09-30T12:00:00') })
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('DTSTART:20261001T073000')
    expect(ics).toContain('DTEND:20261001T080000')
    expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=90')
    expect(ics).toContain('SUMMARY:Parlons: speak 30 min')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true)
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('handles sessions crossing midnight', () => {
    expect(buildIcs({ appName: 'P', startDate: '2026-10-01', days: 1, time: '23:45', minutes: 30 })).toContain('DTEND:20261002T001500')
  })
})
