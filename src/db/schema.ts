import Dexie, { type EntityTable } from 'dexie'
import type { Card as FsrsCard } from 'ts-fsrs'
import type { DayKey } from '../lib/program'

// All data lives on the device in IndexedDB. Every learning record carries `lang`,
// so each language gets its own deck, streak and dashboard.
//
// Migrations: never edit an existing version() block once released. Add a new
// version(n + 1) with the changed stores and an .upgrade() if data must move.

export type Lang = string
export type StageId = 'review' | 'structure' | 'shadowing' | 'speak' | 'conversation'
export type SessionMode = 10 | 30 | 45 | 60

/** Global, not language-specific. Single row with id 'app'. */
export interface AppSettings {
  id: 'app'
  activeLang: Lang
  theme: 'system' | 'light' | 'dark'
  showEnglish: boolean
  lastBackupAt?: number
  storagePersisted?: boolean
  ai: { directEnabled: boolean; apiKey?: string; model: string }
}

/** Per-language learner profile, created during onboarding. */
export interface Profile {
  lang: Lang
  startDate: DayKey
  dailyMinutes: 30 | 45 | 60
  studyTime: string // 'HH:mm'
  voiceURI?: string
  ttsRate: number // 0.7–1.2
  /** Self-assessed can-do statements at the start (ids from lib/cefr.ts). */
  startingCanDo: string[]
  startingLevel: 'A0' | 'A1' | 'A2' | 'B1'
  seedApprovedAt?: number
  onboardedAt: number
  /** Final fluency check (week 12): self-assessment then. */
  finalCanDo?: string[]
  finalLevel?: 'A0' | 'A1' | 'A2' | 'B1'
  finalCheckAt?: number
}

export type CardKind = 'phrase' | 'cloze' | 'error'
export type CardSource = 'seed' | 'repair' | 'script' | 'user' | 'conversation' | 'mistake' | 'ai' | 'recording'

export interface CardRow {
  id: string
  lang: Lang
  kind: CardKind
  /** Target-language text (for cloze: with [[answer]] markers). */
  target: string
  en: string
  /** For error cards: the learner's wrong sentence. */
  wrong?: string
  note?: string
  week?: number
  seedId?: string
  source: CardSource
  /** Audio: 'tts' (default), or a recording/clip id. */
  audioRef?: string
  /** Introduction order for new cards (lower first). Learner-made cards use -1 to jump the queue. */
  order?: number
  fsrs: FsrsCard
  due: number // copy of fsrs.due as ms, indexed
  suspended?: boolean
  createdAt: number
}

export interface ReviewLogRow {
  id?: number
  lang: Lang
  cardId: string
  rating: 1 | 2 | 3 | 4 // Again, Hard, Good, Easy
  state: number // FSRS state before the review
  reviewedAt: number
  day: DayKey
}

export interface StageLog {
  stage: StageId
  plannedSec: number
  actualSec: number
  skipped: boolean
}

export interface SessionRow {
  id: string
  lang: Lang
  day: DayKey
  mode: SessionMode
  startedAt: number
  endedAt?: number
  stages: StageLog[]
  spokenSec: number
  completed: boolean
  externalLesson?: string // e.g. "Language Transfer track 12"
  /** For resuming: the stage in progress, and what was done so far. */
  currentIndex?: number
  activity?: SessionActivity
}

export interface SessionActivity {
  reviewed: number
  again: number
  recordingIds: string[]
  shadowReps: number
  callMinutes: number
}

export type RecordingKind = 'speak' | 'benchmark' | 'shadow' | 'selftalk' | 'fluency' | 'script' | 'snapshot'

export interface RecordingRow {
  id: string
  lang: Lang
  day: DayKey
  week: number
  kind: RecordingKind
  promptId?: string
  promptText?: string
  blob: Blob
  mimeType: string
  durationSec: number
  ratings?: { fluency?: number; accuracy?: number; pronunciation?: number }
  transcript?: string
  /** Then-and-now: which benchmark round (week 1, 4, 8 or 12) this recording belongs to. */
  round?: number
  wpm?: number
  createdAt: number
}

export interface ClipRow {
  id: string
  lang: Lang
  week?: number
  title: string
  source: 'import' | 'bundled' | 'tts'
  blob?: Blob
  mimeType?: string
  text?: string // transcript, or the sentence for TTS clips
  loopA?: number
  loopB?: number
  createdAt: number
}

export interface ConversationRow {
  id: string
  lang: Lang
  day: DayKey
  kind: 'tutor' | 'exchange' | 'ai-prompt' | 'ai-voice' | 'selftalk'
  partner?: string
  durationMin: number
  topics?: string
  newWords: { target: string; en: string; cardId?: string }[]
  confidence?: number // 1–5
  notes?: string
  transcript?: { who: 'me' | 'them'; text: string }[]
  turns?: number
  avgWordsPerTurn?: number
  reportId?: string
  createdAt: number
}

export interface MistakeRow {
  id: string
  lang: Lang
  day: DayKey
  category: string // pack mistake category id
  wrong: string
  correct: string
  explanation?: string
  source: 'recording' | 'conversation' | 'ai' | 'manual'
  sourceId?: string
  cardId?: string
  createdAt: number
}

export interface AiReportRow {
  id: string
  lang: Lang
  day: DayKey
  scenarioId?: string
  raw: string
  report: unknown // validated AiFeedback (lib/aiReport.ts)
  createdAt: number
}

export interface WeeklyReviewRow {
  id: string // `${lang}-w${week}`
  lang: Lang
  week: number
  day: DayKey
  easier: string
  harder: string
  confidence: number
  selfRating: number // 1–5 overall speaking self-rating
  suggestion?: string
  createdAt: number
}

export interface CanDoRow {
  id: string // `${lang}-w${week}-${index}`
  lang: Lang
  week: number
  index: number
  checkedAt: number
}

/** Learner edits to seed content (seed stays untouched in the pack). */
export interface SeedOverrideRow {
  id: string // seed id
  lang: Lang
  target?: string
  en?: string
  note?: string
  hidden?: boolean
}

export class ParlonsDB extends Dexie {
  settings!: EntityTable<AppSettings, 'id'>
  profiles!: EntityTable<Profile, 'lang'>
  cards!: EntityTable<CardRow, 'id'>
  reviewLogs!: EntityTable<ReviewLogRow, 'id'>
  sessions!: EntityTable<SessionRow, 'id'>
  recordings!: EntityTable<RecordingRow, 'id'>
  clips!: EntityTable<ClipRow, 'id'>
  conversations!: EntityTable<ConversationRow, 'id'>
  mistakes!: EntityTable<MistakeRow, 'id'>
  aiReports!: EntityTable<AiReportRow, 'id'>
  weeklyReviews!: EntityTable<WeeklyReviewRow, 'id'>
  canDo!: EntityTable<CanDoRow, 'id'>
  seedOverrides!: EntityTable<SeedOverrideRow, 'id'>

  constructor(name = 'parlons') {
    super(name)
    this.version(1).stores({
      settings: 'id',
      profiles: 'lang',
      cards: 'id, lang, [lang+due], [lang+kind], seedId, source',
      reviewLogs: '++id, lang, cardId, [lang+day]',
      sessions: 'id, lang, [lang+day]',
      recordings: 'id, lang, [lang+kind], [lang+day], promptId',
      clips: 'id, lang, [lang+week]',
      conversations: 'id, lang, [lang+day]',
      mistakes: 'id, lang, [lang+category], [lang+day]',
      aiReports: 'id, lang',
      weeklyReviews: 'id, lang, [lang+week]',
      canDo: 'id, lang, [lang+week]',
      seedOverrides: 'id, lang',
    })
  }
}

export const db = new ParlonsDB()

/** Every table name, in a stable order. Used by backup/restore. */
export const TABLES = [
  'settings', 'profiles', 'cards', 'reviewLogs', 'sessions', 'recordings', 'clips',
  'conversations', 'mistakes', 'aiReports', 'weeklyReviews', 'canDo', 'seedOverrides',
] as const
export type TableName = (typeof TABLES)[number]

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  activeLang: 'fr',
  theme: 'system',
  showEnglish: true,
  ai: { directEnabled: false, model: 'claude-sonnet-5-5' },
}

export async function getSettings(): Promise<AppSettings> {
  return (await db.settings.get('app')) ?? DEFAULT_SETTINGS
}

export async function updateSettings(patch: Partial<Omit<AppSettings, 'id'>>) {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch })
}

export const newId = () => crypto.randomUUID()
