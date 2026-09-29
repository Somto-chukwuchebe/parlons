// @vitest-environment node
// Node (not jsdom) so audio Blobs survive fake-indexeddb, as they do in real browsers.
import { createEmptyCard } from 'ts-fsrs'
import { ParlonsDB } from '../db/schema'
import { BackupError, exportBackup, parseBackup, restoreBackup } from './backup'

const audioBytes = new Uint8Array([0, 1, 2, 3, 250, 251, 252, 253])

async function seed(db: ParlonsDB) {
  const card = createEmptyCard(new Date('2026-10-01T08:00:00Z'))
  await db.settings.put({ id: 'app', activeLang: 'fr', theme: 'dark', showEnglish: true, ai: { directEnabled: false, model: 'm' } })
  await db.profiles.put({ lang: 'fr', startDate: '2026-10-01', dailyMinutes: 30, studyTime: '07:30', ttsRate: 1, startingCanDo: [], startingLevel: 'A1', onboardedAt: 1 })
  await db.cards.put({ id: 'c1', lang: 'fr', kind: 'phrase', target: 'Bonjour', en: 'Hello', source: 'seed', fsrs: card, due: card.due.getTime(), createdAt: 1 })
  await db.reviewLogs.add({ lang: 'fr', cardId: 'c1', rating: 3, state: 0, reviewedAt: 111, day: '2026-10-01' })
  await db.recordings.put({
    id: 'r1', lang: 'fr', day: '2026-10-01', week: 1, kind: 'speak', blob: new Blob([audioBytes], { type: 'audio/mp4' }),
    mimeType: 'audio/mp4', durationSec: 12, createdAt: 2,
  })
}

let n = 0
const freshDb = () => new ParlonsDB(`test-${++n}`)

describe('backup export/import', () => {
  it('round-trips all data including audio and dates', async () => {
    const a = freshDb()
    await seed(a)
    const zip = await exportBackup(a)

    const parsed = parseBackup(zip)
    expect(parsed.preview.counts.cards).toBe(1)
    expect(parsed.preview.counts.recordings).toBe(1)
    expect(parsed.preview.audioFiles).toBe(1)
    expect(parsed.preview.languages).toEqual(['fr'])

    const b = freshDb()
    await restoreBackup(parsed, 'replace', b)

    const card = await b.cards.get('c1')
    expect(card?.fsrs.due).toBeInstanceOf(Date)
    expect(card?.fsrs.due.toISOString()).toBe('2026-10-01T08:00:00.000Z')
    const rec = await b.recordings.get('r1')
    expect(rec?.blob.type).toBe('audio/mp4')
    const bytes = new Uint8Array(await new Response(rec!.blob).arrayBuffer())
    expect([...bytes]).toEqual([...audioBytes])
    expect(await b.reviewLogs.count()).toBe(1)
    expect((await b.settings.get('app'))?.theme).toBe('dark')
  })

  it('merge keeps local data, adds new rows, dedupes reviews and prefers the more-reviewed card', async () => {
    const a = freshDb()
    await seed(a)
    const zip = await exportBackup(a)

    const b = freshDb()
    await seed(b)
    await b.settings.update('app', { theme: 'light' })
    const local = await b.cards.get('c1')
    await b.cards.put({ ...local!, fsrs: { ...local!.fsrs, reps: 5 } })
    await b.cards.put({ ...local!, id: 'c-local' })

    // The backup has an extra card that b doesn't.
    const card = createEmptyCard(new Date())
    await a.cards.put({ id: 'c-remote', lang: 'fr', kind: 'phrase', target: 'Salut', en: 'Hi', source: 'user', fsrs: card, due: card.due.getTime(), createdAt: 3 })
    const zip2 = await exportBackup(a)

    await restoreBackup(parseBackup(zip2), 'merge', b)
    expect(await b.cards.count()).toBe(3)
    expect((await b.cards.get('c1'))?.fsrs.reps).toBe(5)
    expect(await b.reviewLogs.count()).toBe(1)
    expect((await b.settings.get('app'))?.theme).toBe('light')
    expect(zip.byteLength).toBeGreaterThan(0)
  })

  it('rejects files that are not backups', () => {
    expect(() => parseBackup(new Uint8Array([1, 2, 3]))).toThrow(BackupError)
  })
})
