// @vitest-environment node
import { ParlonsDB, type MistakeRow } from '../db/schema'
import { categoryTrends, recurringGroups, saveMistake } from './mistakes'

let n = 0
const freshDb = () => new ParlonsDB(`mistakes-${++n}`)
const base = { lang: 'fr', category: 'prep', source: 'manual' as const }

describe('mistake journal', () => {
  it('saves a mistake and optionally a fix-it card', async () => {
    const db = freshDb()
    const a = await saveMistake({ ...base, day: '2026-10-02', wrong: 'au le café', correct: 'au café' }, false, db)
    expect(a.recurring).toBe(false)
    expect(a.row.cardId).toBeUndefined()
    const b = await saveMistake({ ...base, day: '2026-10-02', wrong: 'à la cinéma', correct: 'au cinéma' }, true, db)
    const card = await db.cards.get(b.row.cardId!)
    expect(card).toMatchObject({ kind: 'error', wrong: 'à la cinéma', target: 'au cinéma' })
  })

  it('recurring mistakes always get an extra card', async () => {
    const db = freshDb()
    await saveMistake({ ...base, day: '2026-10-02', wrong: 'au le café', correct: 'Au café.' }, false, db)
    const again = await saveMistake({ ...base, day: '2026-10-05', wrong: 'à le café', correct: 'au café' }, false, db)
    expect(again.recurring).toBe(true)
    expect(again.row.cardId).toBeDefined()
    expect(await db.cards.count()).toBe(1)
  })

  const m = (day: string, category: string, correct = 'x'): MistakeRow => ({
    id: `${day}-${category}-${Math.random()}`, lang: 'fr', day, category, wrong: 'w', correct, source: 'manual', createdAt: 0,
  })

  it('groups recurring corrections', () => {
    const groups = recurringGroups([m('2026-10-01', 'prep', 'au café'), m('2026-10-02', 'prep', 'Au café !'), m('2026-10-02', 'gender', 'un croissant')])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toHaveLength(2)
  })

  it('shows whether each category is going up or down', () => {
    const today = '2026-11-01'
    const rows = [
      // prep: 3 in the previous fortnight, 1 recently → down
      m('2026-10-06', 'prep'), m('2026-10-08', 'prep'), m('2026-10-10', 'prep'), m('2026-10-25', 'prep'),
      // gender: none before, 2 recently → up
      m('2026-10-28', 'gender'), m('2026-10-31', 'gender'),
    ]
    const t = categoryTrends(rows, ['prep', 'gender', 'tense'], today)
    expect(t.find((x) => x.category === 'prep')).toMatchObject({ recent: 1, before: 3, direction: 'down', total: 4 })
    expect(t.find((x) => x.category === 'gender')).toMatchObject({ recent: 2, before: 0, direction: 'up' })
    expect(t.find((x) => x.category === 'tense')).toMatchObject({ total: 0, direction: 'flat' })
    const weeks = t.find((x) => x.category === 'prep')!.weekly
    expect(weeks).toHaveLength(6)
    expect(weeks.reduce((a, w) => a + w.count, 0)).toBe(4)
  })
})
