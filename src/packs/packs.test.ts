import { availableLanguages, loadPack, PackError } from '.'
import { parseCloze } from './helpers'

describe('language packs', () => {
  it('lists French', () => {
    expect(availableLanguages).toContain('fr')
  })

  it('loads and validates the French pack', async () => {
    const fr = await loadPack('fr')
    expect(fr.code).toBe('fr')
    expect(fr.speech.locale).toBe('fr-FR')
    expect(fr.weeks).toHaveLength(12)
    for (const w of fr.weeks) {
      expect(w.phrases.length).toBeGreaterThanOrEqual(28)
      expect(w.prompts.length).toBeGreaterThanOrEqual(6)
      expect(w.canDo.length).toBeGreaterThanOrEqual(3)
      expect(w.models.length).toBeGreaterThanOrEqual(5)
    }
    expect(fr.aiTemplates.rolePlay).toContain('{{schema}}')
  })

  it('rejects unknown languages', async () => {
    await expect(loadPack('xx')).rejects.toBeInstanceOf(PackError)
  })

  it('has well-formed cloze cards', async () => {
    const fr = await loadPack('fr')
    const clozes = fr.weeks.flatMap((w) => w.phrases).filter((p) => p.cloze)
    expect(clozes.length).toBeGreaterThan(30)
    for (const p of clozes) {
      const { prompt, answer } = parseCloze(p.cloze!)
      expect(answer.length).toBeGreaterThan(0)
      expect(prompt).toContain('_____')
      expect(prompt.replace('_____', answer)).toBe(p.target)
    }
  })

  it('only flags phrases that exist', async () => {
    const fr = await loadPack('fr')
    const ids = new Set([...fr.weeks.flatMap((w) => w.phrases), ...fr.repairPhrases].map((p) => p.id))
    for (const id of Object.keys(fr.reviewFlags)) expect(ids).toContain(id)
  })

  it('applies French typography', async () => {
    const { typography } = await loadPack('fr')
    expect(typography('Ça va ?')).toBe('Ça va ?')
    expect(typography('Salut!')).toBe('Salut !')
    expect(typography('Note : ok')).toBe('Note : ok')
    expect(typography('« bonjour »')).toBe('« bonjour »')
    expect(typography("J'habite")).toBe('J’habite')
    expect(typography('Quoi ?!')).toBe('Quoi ?!')
    expect(typography('8:30')).toBe('8:30')
  })
})
