import { z } from 'zod'

// The feedback report the AI is asked to finish with, as a fenced JSON block.
// Keys are language-neutral ("target" = the language being learned).

export const LEVELS = ['A1', 'A2', 'A2+', 'B1', 'B1+'] as const

export const AiFeedbackSchema = z.object({
  scenario: z.string().default(''),
  level: z.enum(LEVELS).catch('A2'),
  did_well: z.array(z.string()).default([]),
  mistakes: z
    .array(
      z.object({
        you_said: z.string().min(1),
        correct: z.string().min(1),
        explanation: z.string().default(''),
        category: z.string().default('vocab'),
      }),
    )
    .default([]),
  useful_phrases: z.array(z.object({ target: z.string().min(1), en: z.string().default('') })).default([]),
  focus_tomorrow: z.string().default(''),
})
export type AiFeedback = z.infer<typeof AiFeedbackSchema>

/** The shape shown to the AI inside the prompt. */
export function schemaExample(categories: string[]): string {
  return JSON.stringify(
    {
      scenario: 'short name of the scenario',
      level: 'A2',
      did_well: ['…', '…'],
      mistakes: [{ you_said: 'what I wrote', correct: 'the corrected version', explanation: 'one line', category: categories[0] ?? 'vocab' }],
      useful_phrases: [{ target: 'a phrase in the language I am learning', en: 'English meaning' }],
      focus_tomorrow: 'one concrete thing to practise',
    },
    null,
    2,
  )
}

export type ParseResult = { ok: true; report: AiFeedback; warnings: string[] } | { ok: false; error: string }

/** Find the JSON object in an AI reply: a ```json fence first, else the last balanced {...}. */
export function extractJson(text: string): string | null {
  const fences = [...text.matchAll(/```(?:json|JSON)?\s*\n?([\s\S]*?)```/g)].map((m) => m[1].trim())
  const fenced = fences.reverse().find((f) => f.startsWith('{'))
  if (fenced) return fenced
  // Scan for balanced braces, keeping the last complete object (the report comes at the end).
  let depth = 0
  let start = -1
  let last: string | null = null
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (ch === '\\') i++
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}' && depth > 0) {
      depth--
      if (depth === 0) last = text.slice(start, i + 1)
    }
  }
  return last
}

/** Undo common chat-app damage: smart quotes around keys/strings and trailing commas. */
function repair(json: string): string {
  return json
    .replace(/[“”]/g, '"')
    .replace(/,\s*([}\]])/g, '$1')
}

/**
 * Parse and validate a pasted AI reply. Unknown mistake categories are mapped to the
 * closest pack category (or the last one, usually "vocabulary"), with a warning.
 */
export function parseAiFeedback(text: string, categoryIds: string[]): ParseResult {
  const raw = extractJson(text)
  if (!raw) return { ok: false, error: 'No JSON block was found. Make sure you copied the whole reply, including the part in ```json … ```.' }
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    try {
      data = JSON.parse(repair(raw))
    } catch {
      return { ok: false, error: 'The JSON block is incomplete or broken. Ask the AI to "repeat the feedback JSON only", or fill in the form below.' }
    }
  }
  const parsed = AiFeedbackSchema.safeParse(data)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: `The report is missing something (${issue.path.join('.') || 'root'}: ${issue.message}). You can fill in the form below instead.` }
  }
  const warnings: string[] = []
  const fallback = categoryIds.includes('vocab') ? 'vocab' : categoryIds[categoryIds.length - 1]
  const report = {
    ...parsed.data,
    mistakes: parsed.data.mistakes.map((m) => {
      if (categoryIds.includes(m.category)) return m
      const guess = guessCategory(m.category, categoryIds) ?? fallback
      warnings.push(`Category "${m.category}" was read as "${guess}".`)
      return { ...m, category: guess }
    }),
  }
  if (!report.mistakes.length && !report.useful_phrases.length && !report.did_well.length)
    warnings.push('The report is empty: nothing to add. Was the conversation long enough?')
  return { ok: true, report, warnings }
}

const HINTS: Record<string, RegExp> = {
  gender: /gender|agreement|article|genre|accord/i,
  verb: /verb|conjug|participle|form/i,
  tense: /tense|past|future|imparfait|passé|temps/i,
  prep: /prepos/i,
  order: /order|position|syntax/i,
  pron: /pronunc|sound|accent/i,
  vocab: /vocab|word|lexic|spelling|false friend/i,
}

function guessCategory(label: string, ids: string[]): string | undefined {
  return ids.find((id) => HINTS[id]?.test(label))
}
