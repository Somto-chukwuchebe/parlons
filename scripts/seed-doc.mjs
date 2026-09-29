// Writes docs/seed-review-<lang>.md: the whole course seed in readable form, for review.
// Run with: npm run seed-doc [-- fr]
import { createServer } from 'vite'
import { mkdir, writeFile } from 'node:fs/promises'

const lang = process.argv[2] ?? 'fr'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { loadPack } = await server.ssrLoadModule('/src/packs/index.ts')
  const pack = await loadPack(lang)
  const out = []
  const p = (s = '') => out.push(s)

  p(`# ${pack.name} course seed — for review`)
  p()
  p(`Generated from \`src/packs/${lang}/\`. Edit phrases in the app (Course → Edit) or in the pack files.`)
  p()
  const totalPhrases = pack.weeks.reduce((n, w) => n + w.phrases.length, 0)
  const totalPrompts = pack.weeks.reduce((n, w) => n + w.prompts.length, 0)
  p(`**${pack.weeks.length} weeks · ${totalPhrases} phrases · ${totalPrompts} speaking prompts · ${pack.repairPhrases.length} repair phrases**`)
  p()
  p('## ⚑ Please double-check')
  p()
  const all = [...pack.weeks.flatMap((w) => w.phrases), ...pack.repairPhrases]
  for (const [id, why] of Object.entries(pack.reviewFlags)) p(`- **${all.find((x) => x.id === id)?.target ?? id}** — ${why}`)
  p()
  p('Cloze cards (fill-the-gap) are marked with the blanked word in **bold**.')
  p()

  for (const w of pack.weeks) {
    p(`## Week ${w.week}: ${w.theme}`)
    p()
    p(`*Grammar:* ${w.grammar}`)
    p()
    p('### Lesson')
    p()
    p(w.lesson)
    p()
    p('### Model sentences')
    p()
    for (const m of w.models) p(`- ${m.target} — *${m.en}*`)
    p()
    p('### I can…')
    p()
    for (const c of w.canDo) p(`- ${c}`)
    p()
    p('### Phrases')
    p()
    p('| # | French | English | Note |')
    p('|---|---|---|---|')
    w.phrases.forEach((ph, i) => {
      const fr = ph.cloze ? ph.cloze.replace(/\[\[(.+?)\]\]/g, '**$1**') : ph.target
      p(`| ${i + 1} | ${fr} | ${ph.en} | ${ph.note ?? ''} |`)
    })
    p()
    p('### Speaking prompts')
    p()
    for (const q of w.prompts) p(`- ${q.target} — *${q.en}*${q.hints ? ` (hints: ${q.hints.join(' · ')})` : ''}`)
    p()
  }

  p('## Repair phrases (from week 1)')
  p()
  for (const r of pack.repairPhrases) p(`- ${r.target} — *${r.en}*${r.note ? ` (${r.note})` : ''}`)
  p()
  p('## Personal script (weeks 1–2)')
  p()
  for (const s of pack.personalScript) p(`- **Week ${s.week}, ${s.title}:** ${s.guide} Example: ${s.example}`)
  p()
  p('## "Then and now" benchmark prompts (weeks 1, 4, 8, 12)')
  p()
  for (const b of pack.benchmarkPrompts) p(`- ${b.target} — *${b.en}*`)
  p()
  p('## Self-talk prompts')
  p()
  for (const b of pack.selfTalkPrompts) p(`- ${b.target} — *${b.en}*`)
  p()
  p('## Final fluency check (week 12)')
  p()
  for (const f of pack.fluencyCheck) p(`- **${f.title}** (${f.minutes} min): ${f.target}`)
  p()
  p('## Pronunciation drills')
  p()
  for (const d of pack.drills) {
    p(`### ${d.title}`)
    p()
    p(d.explain)
    p()
    for (const i of d.items) p(`- ${i.b ? `${i.a} / ${i.b}` : i.a}${i.en ? ` — *${i.en}*` : ''}`)
    p()
  }
  p('## Role-play scenarios')
  p()
  for (const s of pack.scenarios) p(`- **${s.title}** — ${s.setup} (AI plays ${s.role})`)
  p()
  p('## Mistake categories')
  p()
  for (const m of pack.mistakeCategories) p(`- **${m.label}** — ${m.hint}`)
  p()

  await mkdir('docs', { recursive: true })
  const file = `docs/seed-review-${lang}.md`
  await writeFile(file, out.join('\n'))
  console.log(`Wrote ${file} (${totalPhrases} phrases, ${totalPrompts} prompts).`)
} finally {
  await server.close()
}
