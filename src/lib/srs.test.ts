// @vitest-environment node
import { State } from 'ts-fsrs'
import { ParlonsDB } from '../db/schema'
import { loadPack } from '../packs'
import { addCard, buildQueue, cardId, ensureDeck, gradeCard, NEW_PER_DAY, queueStats } from './srs'

let n = 0
const freshDb = () => new ParlonsDB(`srs-${++n}`)
const DAY = 86_400_000

describe('spaced repetition', () => {
  it('creates cards for weeks reached so far, including clozes and repair phrases', async () => {
    const fr = await loadPack('fr')
    const db = freshDb()
    const { added } = await ensureDeck(fr, 1, db)
    const w1 = fr.weeks[0]
    const clozes = w1.phrases.filter((p) => p.cloze).length
    expect(added).toBe(w1.phrases.length + clozes + fr.repairPhrases.length)
    expect(await db.cards.get(cardId('fr', w1.phrases[0].id))).toBeDefined()
    expect(await db.cards.get(cardId('fr', fr.weeks[1].phrases[0].id))).toBeUndefined()

    // Idempotent; reaching week 2 adds only week 2.
    expect((await ensureDeck(fr, 1, db)).added).toBe(0)
    const w2 = fr.weeks[1]
    expect((await ensureDeck(fr, 2, db)).added).toBe(w2.phrases.length + w2.phrases.filter((p) => p.cloze).length)
  })

  it('applies course edits and hides hidden phrases', async () => {
    const fr = await loadPack('fr')
    const db = freshDb()
    const seed = fr.weeks[0].phrases[1]
    await ensureDeck(fr, 1, db)
    await db.seedOverrides.put({ id: seed.id, lang: 'fr', target: 'Salut, ça roule ?' })
    await db.seedOverrides.put({ id: fr.weeks[0].phrases[2].id, lang: 'fr', hidden: true })
    await ensureDeck(fr, 1, db)
    expect((await db.cards.get(cardId('fr', seed.id)))?.target).toBe('Salut, ça roule ?')
    expect((await db.cards.get(cardId('fr', fr.weeks[0].phrases[2].id)))?.suspended).toBe(true)
  })

  it('introduces at most NEW_PER_DAY new cards a day, in course order, clozes later', async () => {
    const fr = await loadPack('fr')
    const db = freshDb()
    const now = new Date('2026-10-01T08:00:00')
    await ensureDeck(fr, 1, db, now)
    const q = await buildQueue('fr', 60, db, now)
    expect(q).toHaveLength(NEW_PER_DAY)
    expect(q[0].seedId).toBe(fr.weeks[0].phrases[0].id)
    expect(q.every((c) => c.kind === 'phrase')).toBe(true)

    for (const c of q) await gradeCard(c, 'good', db, now)
    const later = new Date(now.getTime() + 60_000)
    const q2 = await buildQueue('fr', 60, db, later)
    expect(q2.filter((c) => c.fsrs.state === State.New)).toHaveLength(0) // today's allowance used
  })

  it('schedules Again sooner than Good, and Good sooner than Easy', async () => {
    const db = freshDb()
    const now = new Date('2026-10-01T08:00:00')
    const base = await addCard({ lang: 'fr', target: 'Bonjour', en: 'Hello', source: 'user' }, db, now)
    const again = await gradeCard(base, 'again', db, now)
    const good = await gradeCard(base, 'good', db, now)
    const easy = await gradeCard(base, 'easy', db, now)
    expect(again.due).toBeLessThan(good.due)
    expect(good.due).toBeLessThan(easy.due)
    expect(await db.reviewLogs.count()).toBe(3)
  })

  it('caps reviews after missed days instead of piling up', async () => {
    const db = freshDb()
    const start = new Date('2026-10-01T08:00:00')
    for (let i = 0; i < 80; i++) {
      const c = await addCard({ lang: 'fr', target: `Phrase ${i}`, en: `Phrase ${i}`, source: 'user' }, db, start)
      await gradeCard(c, 'good', db, start)
    }
    const muchLater = new Date(start.getTime() + 30 * DAY)
    const stats = await queueStats('fr', db, muchLater)
    expect(stats.dueReviews).toBe(80)
    const q = await buildQueue('fr', 25, db, muchLater)
    expect(q).toHaveLength(25)
    // Most overdue first.
    expect(q[0].due).toBeLessThanOrEqual(q[24].due)
  })

  it('learner-made cards are introduced before seed cards', async () => {
    const fr = await loadPack('fr')
    const db = freshDb()
    const now = new Date('2026-10-01T08:00:00')
    await ensureDeck(fr, 1, db, now)
    const mine = await addCard({ lang: 'fr', target: 'Je télétravaille.', en: 'I work from home.', source: 'user' }, db, now)
    const q = await buildQueue('fr', 60, db, now)
    expect(q[0].id).toBe(mine.id)
  })
})
