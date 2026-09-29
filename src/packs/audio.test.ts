// @vitest-environment node
import { existsSync } from 'node:fs'
import { loadPack } from '.'

describe('bundled native audio', () => {
  it('only uses allowed licences, has files, text and translations', async () => {
    const fr = await loadPack('fr')
    const clips = fr.audio?.clips ?? []
    expect(clips.length).toBeGreaterThan(100)
    for (const c of clips) {
      expect(['CC BY-SA 4.0', 'CC BY-NC 4.0']).toContain(c.license)
      expect(c.attribution).toMatch(/^https?:\/\//)
      expect(c.text.length).toBeGreaterThan(0)
      expect(c.en.length).toBeGreaterThan(0)
      expect(existsSync(`public/audio/fr/${c.id}.mp3`)).toBe(true)
    }
  })

  it('has a shadowing set for every week', async () => {
    const fr = await loadPack('fr')
    for (const w of fr.weeks) expect(fr.audio!.clips.filter((c) => c.shadow && c.week === w.week).length).toBeGreaterThanOrEqual(10)
  })

  it('links native recordings only to phrases they match', async () => {
    const fr = await loadPack('fr')
    const all = new Map([...fr.weeks.flatMap((w) => w.phrases), ...fr.repairPhrases].map((p) => [p.id, p.target]))
    const norm = (s: string) => s.toLowerCase().replace(/[’]/g, "'").replace(/[^a-zà-ÿ' ]/g, '').replace(/\s+/g, ' ').trim()
    for (const c of fr.audio!.clips) for (const id of c.seedIds) expect(norm(c.text)).toBe(norm(all.get(id)!))
  })
})
