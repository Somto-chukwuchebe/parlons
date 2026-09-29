// Builds the bundled native-speaker audio for a language pack from Tatoeba (tatoeba.org).
//
//   npm run audio            (French)
//
// 1. Downloads Tatoeba's exports into .cache/tatoeba (once).
// 2. Keeps only recordings under CC BY-SA 4.0 or CC BY-NC 4.0 (never "all rights reserved").
// 3. Takes the hand-picked shadowing clips per week from src/packs/<lang>/audio-picks.json,
//    plus any recording whose text exactly matches a course phrase (used for review cards).
// 4. Downloads the mp3s into public/audio/<lang>/ and writes src/packs/<lang>/audio.json,
//    which the app uses for playback and the credits page.
import { createServer } from 'vite'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const lang = process.argv[2] ?? 'fr'
const TATOEBA_LANG = { fr: 'fra' }[lang]
const ALLOWED = new Set(['CC BY-SA 4.0', 'CC BY-NC 4.0'])
const CACHE = '.cache/tatoeba'
const EXPORTS = 'https://downloads.tatoeba.org/exports'

async function fetchTo(url, file) {
  if (existsSync(file)) return
  console.log(`Downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  await writeFile(file, Buffer.from(await res.arrayBuffer()))
}

async function exportsReady() {
  await mkdir(CACHE, { recursive: true })
  const swa = `${CACHE}/sentences_with_audio.csv`
  if (!existsSync(swa)) {
    await fetchTo(`${EXPORTS}/sentences_with_audio.tar.bz2`, `${CACHE}/swa.tar.bz2`)
    execFileSync('tar', ['xjf', 'swa.tar.bz2'], { cwd: CACHE })
  }
  const files = {
    target: `${TATOEBA_LANG}_sentences.tsv`,
    links: `${TATOEBA_LANG}-eng_links.tsv`,
    eng: 'eng_sentences.tsv',
  }
  const urls = {
    target: `${EXPORTS}/per_language/${TATOEBA_LANG}/${files.target}.bz2`,
    links: `${EXPORTS}/per_language/${TATOEBA_LANG}/${files.links}.bz2`,
    eng: `${EXPORTS}/per_language/eng/${files.eng}.bz2`,
  }
  for (const k of Object.keys(files)) {
    const out = `${CACHE}/${files[k]}`
    if (existsSync(out)) continue
    await fetchTo(urls[k], `${out}.bz2`)
    execFileSync('bunzip2', ['-f', `${out}.bz2`])
  }
  return { swa, ...Object.fromEntries(Object.entries(files).map(([k, f]) => [k, `${CACHE}/${f}`])) }
}

const tsv = async (file) => (await readFile(file, 'utf8')).split('\n').filter(Boolean).map((l) => l.split('\t'))
const norm = (s) =>
  s
    .replace(/[’]/g, "'")
    .replace(/[  ]/g, ' ')
    .toLowerCase()
    .replace(/[«»"!?.,;:…]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')

const f = await exportsReady()
const target = new Map((await tsv(f.target)).map(([id, , text]) => [id, text]))
const eng = new Map((await tsv(f.eng)).map(([id, , text]) => [id, text]))
const toEn = new Map()
for (const [a, b] of await tsv(f.links)) if (!toEn.has(a) && eng.has(b)) toEn.set(a, eng.get(b))

// Every usable recording in the target language, by audio id and by normalised text.
const byAudio = new Map()
const byText = new Map()
for (const [sid, aid, user, license, url] of await tsv(f.swa)) {
  if (!target.has(sid) || !ALLOWED.has(license)) continue
  const rec = { id: Number(aid), sentenceId: Number(sid), text: target.get(sid), en: toEn.get(sid), speaker: user, license, attribution: url || `https://tatoeba.org/user/profile/${user}` }
  byAudio.set(rec.id, rec)
  const k = norm(rec.text)
  // Prefer CC BY-SA when a sentence has several recordings.
  if (!byText.has(k) || (license === 'CC BY-SA 4.0' && byText.get(k).license !== 'CC BY-SA 4.0')) byText.set(k, rec)
}

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { loadPack } = await server.ssrLoadModule('/src/packs/index.ts')
const pack = await loadPack(lang)
await server.close()

const clips = new Map()
const add = (rec, patch) => clips.set(rec.id, { ...rec, ...clips.get(rec.id), ...patch, seedIds: [...(clips.get(rec.id)?.seedIds ?? []), ...(patch.seedIds ?? [])] })

// Hand-picked shadowing clips.
const picks = JSON.parse(await readFile(`src/packs/${lang}/audio-picks.json`, 'utf8'))
// Hand-written English for clips Tatoeba has no English translation for.
const manualEn = picks._en ?? {}
for (const [week, ids] of Object.entries(picks)) {
  if (week.startsWith('_')) continue
  for (const id of ids) {
    const rec = byAudio.get(id)
    if (!rec) throw new Error(`Audio ${id} (week ${week}) is missing or not under an allowed licence.`)
    add(rec, { week: Number(week), shadow: true })
  }
}
// Exact matches for course phrases: native audio for those review cards.
const phrases = [...pack.weeks.flatMap((w) => w.phrases.map((p) => ({ p, week: w.week }))), ...pack.repairPhrases.map((p) => ({ p, week: 1 }))]
let matched = 0
for (const { p, week } of phrases) {
  const rec = byText.get(norm(p.target))
  if (rec) {
    add(rec, { seedIds: [p.id], week: clips.get(rec.id)?.week ?? week })
    matched++
  }
}

const outDir = `public/audio/${lang}`
await mkdir(outDir, { recursive: true })
for (const c of clips.values()) {
  const file = `${outDir}/${c.id}.mp3`
  if (existsSync(file)) continue
  const res = await fetch(`https://tatoeba.org/audio/download/${c.id}`)
  if (!res.ok) throw new Error(`Audio ${c.id}: HTTP ${res.status}`)
  await writeFile(file, Buffer.from(await res.arrayBuffer()))
  await new Promise((r) => setTimeout(r, 150)) // be gentle with Tatoeba's server
}

const list = [...clips.values()]
  .sort((a, b) => a.week - b.week || a.id - b.id)
  .map(({ id, sentenceId, text, en, speaker, license, attribution, week, shadow, seedIds }) => ({
    id, sentenceId, text, en: en ?? manualEn[id] ?? '', speaker, license, attribution, week, shadow: !!shadow, seedIds,
  }))
await writeFile(
  `src/packs/${lang}/audio.json`,
  JSON.stringify({ source: 'Tatoeba (tatoeba.org)', generatedAt: new Date().toISOString().slice(0, 10), clips: list }, null, 1) + '\n',
)
const speakers = [...new Set(list.map((c) => `${c.speaker} (${c.license})`))]
console.log(`Wrote ${list.length} clips (${list.filter((c) => c.shadow).length} shadowing, ${matched} course phrases with native audio).`)
console.log(`Speakers: ${speakers.join(', ')}`)
