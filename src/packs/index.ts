import { LanguagePackSchema, type LanguagePack } from './types'

// Registry of available language packs. Each one is code-split and loaded on demand.
// To add a language: create src/packs/<code>/index.ts and add a line here.
const registry: Record<string, () => Promise<{ default: LanguagePack }>> = {
  fr: () => import('./fr'),
}

export const availableLanguages = Object.keys(registry)

const cache = new Map<string, LanguagePack>()

export class PackError extends Error {}

/** Load and validate a pack. Throws PackError for unknown codes or invalid seed data. */
export async function loadPack(code: string): Promise<LanguagePack> {
  const cached = cache.get(code)
  if (cached) return cached
  const loader = registry[code]
  if (!loader) throw new PackError(`No language pack for "${code}".`)
  const pack = (await loader()).default
  const parsed = LanguagePackSchema.safeParse(pack)
  if (!parsed.success) {
    throw new PackError(`Language pack "${code}" is invalid: ${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message}`)
  }
  assertUniqueIds(pack)
  cache.set(code, pack)
  return pack
}

function assertUniqueIds(pack: LanguagePack) {
  const seen = new Set<string>()
  const all = [
    ...pack.weeks.flatMap((w) => [...w.phrases, ...w.prompts]),
    ...pack.repairPhrases,
    ...pack.benchmarkPrompts,
    ...pack.selfTalkPrompts,
  ]
  for (const item of all) {
    if (seen.has(item.id)) throw new PackError(`Duplicate id "${item.id}" in pack "${pack.code}".`)
    seen.add(item.id)
  }
}
