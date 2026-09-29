import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Grade } from 'ts-fsrs'
import { db, type CardRow, type CardSource, type ParlonsDB, type SeedOverrideRow } from '../db/schema'
import type { LanguagePack, PhraseSeed } from '../packs/types'
import { withOverride } from './seed'
import { toDayKey } from './program'

// Spaced repetition with FSRS (ts-fsrs).
//
// - Seed phrases become cards as their week arrives (plus repair phrases from week 1).
// - Each session reviews what's due first, then introduces a few new cards.
// - Missed days never pile up: a session shows at most `cap` cards; FSRS keeps the rest
//   scheduled and they come back in later sessions.

export const NEW_PER_DAY = 10
export const scheduler = fsrs(generatorParameters({ enable_fuzz: true, request_retention: 0.9 }))

export type GradeName = 'again' | 'hard' | 'good' | 'easy'
export const GRADES: Record<GradeName, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

export const cardId = (lang: string, seedId: string, kind: 'phrase' | 'cloze' = 'phrase') =>
  kind === 'cloze' ? `${lang}:${seedId}:cloze` : `${lang}:${seedId}`

function newCard(
  lang: string,
  p: PhraseSeed,
  kind: 'phrase' | 'cloze',
  week: number | undefined,
  source: CardSource,
  order: number,
  now: Date,
): CardRow {
  const fsrsCard = createEmptyCard(now)
  return {
    id: cardId(lang, p.id, kind),
    lang,
    kind,
    target: kind === 'cloze' ? p.cloze! : p.target,
    en: p.en,
    note: p.note,
    week,
    seedId: p.id,
    source,
    order,
    fsrs: fsrsCard,
    due: fsrsCard.due.getTime(),
    createdAt: now.getTime(),
  }
}

/**
 * Make sure cards exist for every seed phrase up to `uptoWeek` (and repair phrases),
 * and keep their text in sync with the learner's course edits. Idempotent.
 */
export async function ensureDeck(pack: LanguagePack, uptoWeek: number, database: ParlonsDB = db, now = new Date()) {
  const lang = pack.code
  const overrides = new Map<string, SeedOverrideRow>(
    (await database.seedOverrides.where('lang').equals(lang).toArray()).map((o) => [o.id, o]),
  )
  // Introduction order: each week's phrases in course order (week 1 interleaves the repair
  // phrases), then that week's cloze cards, so a phrase and its cloze never land on the same day.
  const wanted: { p: PhraseSeed; week?: number; source: CardSource; order: number }[] = []
  for (const w of pack.weeks.slice(0, Math.max(1, Math.min(uptoWeek, pack.weeks.length)))) {
    const items: { p: PhraseSeed; source: CardSource }[] = []
    const repair = w.week === 1 ? [...pack.repairPhrases] : []
    w.phrases.forEach((p, i) => {
      items.push({ p, source: 'seed' })
      if (i % 2 === 1 && repair.length) items.push({ p: repair.shift()!, source: 'repair' })
    })
    for (const r of repair) items.push({ p: r, source: 'repair' })
    items.forEach(({ p, source }, i) => wanted.push({ p, week: w.week, source, order: w.week * 1000 + i }))
  }

  const toAdd: CardRow[] = []
  const toUpdate: CardRow[] = []
  const existingIds = new Set(
    await database.cards.where('lang').equals(lang).primaryKeys(),
  )
  const existing = new Map(
    (await database.cards.bulkGet(wanted.flatMap(({ p }) => [cardId(lang, p.id), cardId(lang, p.id, 'cloze')])))
      .filter((c): c is CardRow => !!c)
      .map((c) => [c.id, c]),
  )

  for (const { p: seed, week, source, order } of wanted) {
    const hidden = overrides.get(seed.id)?.hidden === true
    const p = withOverride(seed, overrides) ?? seed
    for (const kind of ['phrase', 'cloze'] as const) {
      if (kind === 'cloze' && !p.cloze) continue
      const id = cardId(lang, seed.id, kind)
      const target = kind === 'cloze' ? p.cloze! : p.target
      const current = existing.get(id)
      if (!current && !existingIds.has(id)) {
        const c = newCard(lang, p, kind, week, source, kind === 'cloze' ? order + 500 : order, now)
        if (hidden) c.suspended = true
        toAdd.push(c)
      } else if (current && (current.target !== target || current.en !== p.en || current.note !== p.note || !!current.suspended !== hidden)) {
        toUpdate.push({ ...current, target, en: p.en, note: p.note, suspended: hidden || undefined })
      }
    }
    // If an edit removed the cloze, retire the old cloze card.
    const oldCloze = existing.get(cardId(lang, seed.id, 'cloze'))
    if (oldCloze && !p.cloze && !oldCloze.suspended) toUpdate.push({ ...oldCloze, suspended: true })
  }
  if (toAdd.length) await database.cards.bulkAdd(toAdd)
  if (toUpdate.length) await database.cards.bulkPut(toUpdate)
  return { added: toAdd.length, updated: toUpdate.length }
}

/** How many new cards were introduced today (first reviews logged today). */
async function newIntroducedToday(lang: string, database: ParlonsDB, today: string) {
  return database.reviewLogs
    .where('[lang+day]')
    .equals([lang, today])
    .filter((l) => l.state === State.New)
    .count()
}

export interface QueueStats {
  dueReviews: number // reviews due now (not new)
  newAvailable: number // new cards still allowed today
}

/** Numbers for the Today screen. */
export async function queueStats(lang: string, database: ParlonsDB = db, now = new Date()): Promise<QueueStats> {
  const cards = await database.cards.where('[lang+due]').between([lang, 0], [lang, now.getTime()], true, true).toArray()
  const active = cards.filter((c) => !c.suspended)
  const dueReviews = active.filter((c) => c.fsrs.state !== State.New).length
  const newCards = active.filter((c) => c.fsrs.state === State.New).length
  const allowance = Math.max(0, NEW_PER_DAY - (await newIntroducedToday(lang, database, toDayKey(now))))
  return { dueReviews, newAvailable: Math.min(newCards, allowance) }
}

/**
 * Build a session's review queue: due reviews first (most overdue first), then new cards
 * in course order, never more than `cap` in total.
 */
export async function buildQueue(lang: string, cap: number, database: ParlonsDB = db, now = new Date()): Promise<CardRow[]> {
  const due = (await database.cards.where('[lang+due]').between([lang, 0], [lang, now.getTime()], true, true).toArray()).filter(
    (c) => !c.suspended,
  )
  const reviews = due.filter((c) => c.fsrs.state !== State.New).sort((a, b) => a.due - b.due)
  const fresh = due
    .filter((c) => c.fsrs.state === State.New)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdAt - b.createdAt)
  const allowance = Math.max(0, NEW_PER_DAY - (await newIntroducedToday(lang, database, toDayKey(now))))
  const queue = reviews.slice(0, cap)
  queue.push(...fresh.slice(0, Math.min(allowance, cap - queue.length)))
  return queue
}

/** Grade a card: reschedule it with FSRS and log the review. Returns the updated card. */
export async function gradeCard(card: CardRow, grade: GradeName, database: ParlonsDB = db, now = new Date()): Promise<CardRow> {
  const { card: next } = scheduler.next(card.fsrs, now, GRADES[grade])
  const updated: CardRow = { ...card, fsrs: next, due: next.due.getTime() }
  await database.transaction('rw', database.cards, database.reviewLogs, async () => {
    await database.cards.put(updated)
    await database.reviewLogs.add({
      lang: card.lang,
      cardId: card.id,
      rating: GRADES[grade] as 1 | 2 | 3 | 4,
      state: card.fsrs.state,
      reviewedAt: now.getTime(),
      day: toDayKey(now),
    })
  })
  return updated
}

/** Short human label for when a card will come back, e.g. "10 min", "3 days". */
export function intervalLabel(card: CardRow, grade: GradeName, now = new Date()): string {
  const next = scheduler.next(card.fsrs, now, GRADES[grade]).card.due.getTime()
  const mins = Math.max(1, Math.round((next - now.getTime()) / 60_000))
  if (mins < 60) return `${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.round(hours / 24)
  if (days < 31) return `${days} day${days === 1 ? '' : 's'}`
  const months = Math.round(days / 30)
  return `${months} mo`
}

/** Add a learner-made card (quick add, conversation log, mistake journal, AI feedback). */
export async function addCard(
  input: { lang: string; target: string; en: string; note?: string; kind?: 'phrase' | 'error'; wrong?: string; source: CardSource; week?: number },
  database: ParlonsDB = db,
  now = new Date(),
): Promise<CardRow> {
  const fsrsCard = createEmptyCard(now)
  const card: CardRow = {
    id: crypto.randomUUID(),
    lang: input.lang,
    kind: input.kind ?? 'phrase',
    target: input.target.trim(),
    en: input.en.trim(),
    note: input.note?.trim() || undefined,
    wrong: input.wrong?.trim() || undefined,
    week: input.week,
    source: input.source,
    // Learner-made cards jump the new-card queue: they matter to you right now.
    order: -1,
    fsrs: fsrsCard,
    due: fsrsCard.due.getTime(),
    createdAt: now.getTime(),
  }
  await database.cards.add(card)
  return card
}
