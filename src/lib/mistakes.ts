import { addDays, format, startOfWeek } from 'date-fns'
import { db, newId, type MistakeRow, type ParlonsDB } from '../db/schema'
import { fromDayKey, type DayKey } from './program'
import { addCard } from './srs'

// Mistake journal logic: saving (with recurrence → extra practice) and trends per category.

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[.,!?;:«»"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export interface MistakeInput {
  lang: string
  day: DayKey
  category: string
  wrong: string
  correct: string
  explanation?: string
  source: MistakeRow['source']
  sourceId?: string
}

/**
 * Save a mistake. If the same correction was logged before, it's recurring: it always
 * gets an extra "fix it" card (even if the learner didn't ask for one), because
 * repeated mistakes need repeated practice.
 */
export async function saveMistake(input: MistakeInput, makeCard: boolean, database: ParlonsDB = db): Promise<{ row: MistakeRow; recurring: boolean }> {
  const previous = await database.mistakes
    .where('[lang+category]')
    .equals([input.lang, input.category])
    .filter((m) => norm(m.correct) === norm(input.correct))
    .count()
  const recurring = previous > 0
  let cardId: string | undefined
  if (makeCard || recurring) {
    const card = await addCard(
      { lang: input.lang, kind: 'error', wrong: input.wrong, target: input.correct, en: input.explanation?.trim() || 'Say the correct version.', source: 'mistake' },
      database,
    )
    cardId = card.id
  }
  const row: MistakeRow = {
    id: newId(),
    lang: input.lang,
    day: input.day,
    category: input.category,
    wrong: input.wrong.trim(),
    correct: input.correct.trim(),
    explanation: input.explanation?.trim() || undefined,
    source: input.source,
    sourceId: input.sourceId,
    cardId,
    createdAt: Date.now(),
  }
  await database.mistakes.add(row)
  return { row, recurring }
}

/** Group identical corrections; returns groups seen 2+ times, most frequent first. */
export function recurringGroups(mistakes: MistakeRow[]) {
  const groups = new Map<string, MistakeRow[]>()
  for (const m of mistakes) {
    const k = `${m.category}|${norm(m.correct)}`
    groups.set(k, [...(groups.get(k) ?? []), m])
  }
  return [...groups.values()].filter((g) => g.length > 1).sort((a, b) => b.length - a.length)
}

export interface CategoryTrend {
  category: string
  total: number
  recent: number // last 14 days
  before: number // the 14 days before that
  direction: 'up' | 'down' | 'flat'
  weekly: { week: DayKey; count: number }[] // last 6 calendar weeks, oldest first
}

/** Per-category counts and whether each is rising or falling. */
export function categoryTrends(mistakes: MistakeRow[], categories: string[], today: DayKey): CategoryTrend[] {
  const t = fromDayKey(today)
  const recentStart = format(addDays(t, -13), 'yyyy-MM-dd')
  const beforeStart = format(addDays(t, -27), 'yyyy-MM-dd')
  const weekStarts = Array.from({ length: 6 }, (_, i) => format(startOfWeek(addDays(t, -7 * (5 - i)), { weekStartsOn: 1 }), 'yyyy-MM-dd'))
  return categories.map((category) => {
    const mine = mistakes.filter((m) => m.category === category)
    const recent = mine.filter((m) => m.day >= recentStart && m.day <= today).length
    const before = mine.filter((m) => m.day >= beforeStart && m.day < recentStart).length
    const weekly = weekStarts.map((week, i) => {
      const end = weekStarts[i + 1] ?? format(addDays(t, 1), 'yyyy-MM-dd')
      return { week, count: mine.filter((m) => m.day >= week && m.day < end).length }
    })
    const direction = recent > before ? 'up' : recent < before ? 'down' : 'flat'
    return { category, total: mine.length, recent, before, direction, weekly }
  })
}
