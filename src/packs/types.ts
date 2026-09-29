import { z } from 'zod'

// Everything language-specific lives in a pack with this shape.
// Packs are validated with Zod when loaded, so a typo in seed data fails loudly in tests.

export const PhraseSeed = z.object({
  id: z.string().min(1),
  target: z.string().min(1), // in the target language
  en: z.string().min(1),
  note: z.string().optional(),
  /** Blank one word for a cloze card, written as [[word]] inside `target`. */
  cloze: z.string().optional(),
})
export type PhraseSeed = z.infer<typeof PhraseSeed>

export const PromptSeed = z.object({
  id: z.string().min(1),
  target: z.string().min(1),
  en: z.string().min(1),
  /** Short hints of phrases to use. */
  hints: z.array(z.string()).optional(),
})
export type PromptSeed = z.infer<typeof PromptSeed>

export const LessonSentence = z.object({ target: z.string(), en: z.string() })

export const WeekSeed = z.object({
  week: z.number().int().min(1),
  theme: z.string(),
  grammar: z.string(),
  /** Plain-English explanation of the pattern shown in the Structure stage. */
  lesson: z.string(),
  models: z.array(LessonSentence).min(5).max(10),
  canDo: z.array(z.string()).min(3).max(5),
  phrases: z.array(PhraseSeed).min(20),
  prompts: z.array(PromptSeed).min(6),
})
export type WeekSeed = z.infer<typeof WeekSeed>

export const DrillSeed = z.object({
  id: z.string(),
  title: z.string(),
  explain: z.string(),
  /** Minimal pairs or practice lines, spoken by TTS or a bundled clip. */
  items: z.array(z.object({ a: z.string(), b: z.string().optional(), en: z.string().optional() })).min(3),
})
export type DrillSeed = z.infer<typeof DrillSeed>

export const ScenarioSeed = z.object({
  id: z.string(),
  title: z.string(),
  /** Situation description handed to the AI role-play template. */
  setup: z.string(),
  role: z.string(),
})
export type ScenarioSeed = z.infer<typeof ScenarioSeed>

export const MistakeCategory = z.object({ id: z.string(), label: z.string(), hint: z.string() })
export type MistakeCategory = z.infer<typeof MistakeCategory>

export const AudioClip = z.object({
  id: z.number(), // file: public/audio/<lang>/<id>.mp3
  sentenceId: z.number(),
  text: z.string(),
  en: z.string(),
  speaker: z.string(),
  license: z.string(),
  attribution: z.string(),
  week: z.number(),
  shadow: z.boolean(), // part of that week's shadowing set
  seedIds: z.array(z.string()), // course phrases this recording says exactly
})
export type AudioClip = z.infer<typeof AudioClip>

export const LanguagePackSchema = z.object({
  code: z.string().min(2),
  name: z.string(), // "French"
  nativeName: z.string(), // "Français"
  accent: z.object({ light: z.string(), dark: z.string(), soft: z.string(), softDark: z.string() }),
  speech: z.object({
    locale: z.string(), // BCP-47, e.g. fr-FR
    preferredVoices: z.array(z.string()),
  }),
  weeks: z.array(WeekSeed).min(1),
  repairPhrases: z.array(PhraseSeed).min(3),
  /** Weeks 1–2: guided "about me" texts that become phrase cards. */
  personalScript: z.array(z.object({ id: z.string(), week: z.number(), title: z.string(), guide: z.string(), example: z.string() })),
  benchmarkPrompts: z.array(PromptSeed).min(1),
  selfTalkPrompts: z.array(PromptSeed).min(5),
  fluencyCheck: z.array(z.object({ id: z.string(), title: z.string(), target: z.string(), minutes: z.number() })),
  drills: z.array(DrillSeed),
  scenarios: z.array(ScenarioSeed).min(1),
  mistakeCategories: z.array(MistakeCategory).min(1),
  /** Seed items the author wants a second opinion on: id → reason. Shown with ⚑ in the review screen. */
  reviewFlags: z.record(z.string(), z.string()).default({}),
  /** Bundled native-speaker recordings (optional; built by scripts/build-audio.mjs). */
  audio: z.object({ source: z.string(), clips: z.array(AudioClip) }).optional(),
  aiTemplates: z.object({ rolePlay: z.string(), weeklyReview: z.string(), voiceSystem: z.string() }),
})

export type LanguagePack = z.infer<typeof LanguagePackSchema> & {
  /** Language-specific typography, e.g. French non-breaking spaces. */
  typography: (text: string) => string
}
