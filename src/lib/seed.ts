import type { PhraseSeed } from '../packs/types'
import type { SeedOverrideRow } from '../db/schema'

/** Apply the learner's edits to a seed phrase. Returns null if they hid it. */
export function withOverride(p: PhraseSeed, overrides: Map<string, SeedOverrideRow>): PhraseSeed | null {
  const o = overrides.get(p.id)
  if (!o) return p
  if (o.hidden) return null
  const target = o.target ?? p.target
  // If the learner changed the sentence, the old cloze no longer matches: drop it.
  const cloze = o.target && o.target !== p.target ? undefined : p.cloze
  return { ...p, target, en: o.en ?? p.en, note: o.note ?? p.note, cloze }
}
