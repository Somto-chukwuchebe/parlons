import type { PhraseSeed, PromptSeed } from './types'

// Compact seed authoring helpers.
//
// A phrase is written as [target, english, note?]. Wrap one word in [[double brackets]]
// to also make a cloze card from it: "J'[[habite]] à Moscou." → blank on "habite".

export type PhraseRow = [target: string, en: string, note?: string]
export type PromptRow = [target: string, en: string, hints?: string[]]

const pad = (n: number) => String(n).padStart(2, '0')

export function phrases(prefix: string, rows: PhraseRow[]): PhraseSeed[] {
  return rows.map(([raw, en, note], i) => {
    const hasCloze = /\[\[.+?\]\]/.test(raw)
    const target = raw.replace(/\[\[(.+?)\]\]/g, '$1')
    return {
      id: `${prefix}-p${pad(i + 1)}`,
      target,
      en,
      ...(note ? { note } : {}),
      ...(hasCloze ? { cloze: raw } : {}),
    }
  })
}

export function prompts(prefix: string, rows: PromptRow[]): PromptSeed[] {
  return rows.map(([target, en, hints], i) => ({
    id: `${prefix}-q${pad(i + 1)}`,
    target,
    en,
    ...(hints ? { hints } : {}),
  }))
}

/** Split a cloze string into the visible prompt ("J'____ à Moscou.") and the answer. */
export function parseCloze(cloze: string): { prompt: string; answer: string } {
  const m = cloze.match(/\[\[(.+?)\]\]/)
  return {
    prompt: cloze.replace(/\[\[(.+?)\]\]/, '_____').replace(/\[\[(.+?)\]\]/g, '$1'),
    answer: m ? m[1] : '',
  }
}
