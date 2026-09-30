import { extractJson, parseAiFeedback, schemaExample } from './aiReport'
import { fillTemplate, placeholders } from './template'
import { loadPack } from '../packs'

const CATS = ['gender', 'verb', 'tense', 'prep', 'order', 'pron', 'vocab']

const good = {
  scenario: 'Café',
  level: 'A2',
  did_well: ['Polite requests', 'Good use of je voudrais'],
  mistakes: [
    { you_said: 'Je suis allé au le café', correct: 'Je suis allé au café', explanation: 'à + le = au', category: 'prep' },
    { you_said: 'une croissant', correct: 'un croissant', explanation: 'croissant is masculine', category: 'gender' },
  ],
  useful_phrases: [{ target: "Qu'est-ce que vous me conseillez ?", en: 'What do you recommend?' }],
  focus_tomorrow: 'Articles with food words',
}

describe('AI feedback parsing', () => {
  it('reads a fenced JSON block after the prose report', () => {
    const reply = `Great job today!\n\n**What you did well**\n- ...\n\n\`\`\`json\n${JSON.stringify(good, null, 2)}\n\`\`\`\nBonne continuation !`
    const r = parseAiFeedback(reply, CATS)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.report.mistakes).toHaveLength(2)
      expect(r.report.useful_phrases[0].target).toContain('conseillez')
      expect(r.warnings).toEqual([])
    }
  })

  it('reads bare JSON without a fence, taking the last object', () => {
    const reply = `Example of the format: {"note": "ignore me"}\nHere is the report: ${JSON.stringify(good)}`
    expect(extractJson(reply)).toBe(JSON.stringify(good))
    expect(parseAiFeedback(reply, CATS).ok).toBe(true)
  })

  it('repairs smart quotes and trailing commas from chat apps', () => {
    const broken = '```json\n{“scenario”: “Café”, “level”: “B1”, “did_well”: [“x”,], “mistakes”: [], “useful_phrases”: [], “focus_tomorrow”: “y”,}\n```'
    const r = parseAiFeedback(broken, CATS)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.report.level).toBe('B1')
  })

  it('fills defaults and maps unknown categories and levels', () => {
    const r = parseAiFeedback(
      JSON.stringify({ level: 'C2', mistakes: [{ you_said: 'a', correct: 'b', category: 'Verb conjugation' }, { you_said: 'c', correct: 'd', category: 'style' }] }),
      CATS,
    )
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.report.level).toBe('A2')
      expect(r.report.mistakes.map((m) => m.category)).toEqual(['verb', 'vocab'])
      expect(r.report.useful_phrases).toEqual([])
      expect(r.warnings.length).toBe(2)
    }
  })

  it('fails helpfully when there is no JSON or it is invalid', () => {
    expect(parseAiFeedback('Just prose, no JSON.', CATS)).toMatchObject({ ok: false })
    expect(parseAiFeedback('```json\n{"mistakes": [ {"you_said": "a"\n```', CATS)).toMatchObject({ ok: false })
    const r = parseAiFeedback(JSON.stringify({ mistakes: [{ you_said: '', correct: 'x' }] }), CATS)
    expect(r.ok).toBe(false)
  })

  it('warns when the report is empty', () => {
    const r = parseAiFeedback('```json\n{}\n```', CATS)
    expect(r.ok && r.warnings.some((w) => /empty/.test(w))).toBe(true)
  })

  it('round-trips its own schema example', () => {
    const r = parseAiFeedback(schemaExample(CATS), CATS)
    expect(r.ok).toBe(true)
  })
})

describe('prompt templates', () => {
  it('fills placeholders and leaves unknown ones visible', () => {
    expect(fillTemplate('Hi {{name}}, week {{ week }} {{missing}}', { name: 'A', week: 3 })).toBe('Hi A, week 3 {{missing}}')
  })

  it('the French role-play template uses only known placeholders', async () => {
    const fr = await loadPack('fr')
    const known = ['level', 'scenario', 'role', 'week', 'theme', 'grammar', 'phrases', 'correctionRule', 'turns', 'schema', 'categories']
    for (const p of placeholders(fr.aiTemplates.rolePlay)) expect(known).toContain(p)
  })
})
