import { useEffect, useMemo, useState } from 'react'
import { Check, ClipboardCopy, ClipboardPaste, Plus, Share2, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, Eyebrow, Notice, PageHeader, Segmented, Select, TextArea, TextInput } from '../components/ui'
import { db, newId } from '../db/schema'
import { AiFeedbackSchema, LEVELS, parseAiFeedback, schemaExample, type AiFeedback } from '../lib/aiReport'
import { saveMistake } from '../lib/mistakes'
import { contentWeek } from '../lib/program'
import { addCard } from '../lib/srs'
import { storageErrorMessage } from '../lib/storage'
import { fillTemplate } from '../lib/template'

// AI role-play, prompt-builder mode: the app writes a prompt for any AI chat assistant,
// you have the conversation there, then paste the reply back to turn feedback into practice.

const DRAFT_KEY = 'parlons.roleplay.draft'
type Mode = 'flow' | 'coach'

function loadDraft(): { scenario?: string; mode?: Mode; pasted?: string } {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}')
  } catch {
    return {}
  }
}
function saveDraft(d: object) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
  } catch {
    /* private mode: fine */
  }
}

export function RolePlay({ embedded = false }: { embedded?: boolean }) {
  const { pack, plan, today, profile } = useApp()
  const draft = useMemo(loadDraft, [])
  const [scenarioId, setScenarioId] = useState(draft.scenario ?? pack.scenarios[0].id)
  const [mode, setMode] = useState<Mode>(draft.mode ?? 'flow')
  const [turns, setTurns] = useState(12)
  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState(draft.pasted ?? '')
  const [report, setReport] = useState<AiFeedback | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => saveDraft({ scenario: scenarioId, mode, pasted }), [scenarioId, mode, pasted])

  const weekNo = plan ? contentWeek(plan, today) : 1
  const week = pack.weeks[weekNo - 1]
  const scenario = pack.scenarios.find((s) => s.id === scenarioId) ?? pack.scenarios[0]
  // Rough current level: where the course has got to, or the starting level if higher.
  const order = ['A0', 'A1', 'A2', 'A2+', 'B1']
  const byWeek = weekNo <= 4 ? 'A1' : weekNo <= 8 ? 'A2' : 'A2+'
  const start = profile?.startingLevel ?? 'A0'
  const current = order.indexOf(start) > order.indexOf(byWeek) ? start : byWeek
  const level = `${current} (week ${weekNo} of a 12-week course aiming for confident A2 speaking, heading to B1)`

  const prompt = fillTemplate(pack.aiTemplates.rolePlay, {
    level,
    scenario: scenario.setup,
    role: scenario.role,
    week: weekNo,
    theme: week.theme,
    grammar: week.grammar,
    phrases: week.phrases
      .slice(0, 12)
      .map((p) => `  - ${p.target} (${p.en})`)
      .join('\n'),
    correctionRule:
      mode === 'flow'
        ? "Flow mode: don't correct me during the conversation. Keep it natural and save every correction for the feedback report at the end."
        : 'Coach mode: after each of my turns, if I made a mistake, add one short correction in English in square brackets, then continue in the language.',
    turns: `${turns}`,
    schema: schemaExample(pack.mistakeCategories.map((c) => c.id)),
    categories: pack.mistakeCategories.map((c) => `"${c.id}" (${c.label})`).join(', '),
  })

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
      alert('Copying was blocked. Select the prompt text and copy it manually.')
    }
  }

  function readReply() {
    const r = parseAiFeedback(pasted, pack.mistakeCategories.map((c) => c.id))
    if (r.ok) {
      setReport(r.report)
      setWarnings(r.warnings)
      setParseError(null)
    } else {
      setParseError(r.error)
      setReport(null)
    }
  }

  return (
    <div className={embedded ? 'space-y-5' : ''}>
      {!embedded && <PageHeader back="/speak" title="AI role-play" subtitle="Practise real situations with any AI chat assistant, then bring the feedback back here." />}

      <div className={cx('grid gap-6', !embedded && 'lg:grid-cols-2')}>
        <section className="space-y-4">
          <Card className="space-y-4">
            <Eyebrow className="text-accent">1 · Build your prompt</Eyebrow>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {pack.scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScenarioId(s.id)}
                  aria-pressed={scenarioId === s.id}
                  className={cx('min-h-14 rounded-2xl border-2 px-3 py-2 text-left text-sm font-extrabold', scenarioId === s.id ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface')}
                >
                  {s.id === 'surprise' && <Sparkles size={14} className="mb-0.5 inline" />} {s.title}
                </button>
              ))}
            </div>
            <p className="text-sm font-semibold text-muted">{scenario.setup}</p>
            <Segmented
              label="Corrections"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'flow', label: 'Flow: at the end' },
                { value: 'coach', label: 'Coach: every turn' },
              ]}
            />
            <Select label="Length" value={turns} onChange={(e) => setTurns(Number(e.target.value))}>
              <option value={8}>Short, about 8 of my turns (≈10 min)</option>
              <option value={12}>Medium, about 12 turns (≈15 min)</option>
              <option value={20}>Long, about 20 turns (≈25 min)</option>
            </Select>
            <details>
              <summary className="cursor-pointer text-sm font-extrabold text-accent">Show the prompt</summary>
              <pre className="mt-2 max-h-72 overflow-auto rounded-2xl bg-sunk p-3 text-xs whitespace-pre-wrap">{prompt}</pre>
            </details>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={copied ? <Check size={18} /> : <ClipboardCopy size={18} />} onClick={copy}>
                {copied ? 'Copied!' : 'Copy prompt'}
              </Button>
              {'share' in navigator && (
                <Button icon={<Share2 size={18} />} onClick={() => navigator.share({ text: prompt }).catch(() => {})}>
                  Share to an app
                </Button>
              )}
            </div>
            <p className="text-xs font-semibold text-muted">
              Paste it into any AI chat (Claude, ChatGPT, etc.). Talk by typing or with the app's voice mode. Type "help" for a hint and "fin" to finish and get
              your report.
            </p>
          </Card>
        </section>

        <section className="space-y-4">
          <Card className="space-y-4">
            <Eyebrow className="text-accent">2 · Paste the AI's final reply</Eyebrow>
            <TextArea
              label="The feedback report"
              hint="Paste the whole last message, including the ```json block at the end."
              rows={6}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={<Wand2 size={18} />} onClick={readReply} disabled={!pasted.trim()}>
                Read the report
              </Button>
              {'clipboard' in navigator && 'readText' in navigator.clipboard && (
                <Button
                  icon={<ClipboardPaste size={18} />}
                  onClick={async () => {
                    try {
                      setPasted(await navigator.clipboard.readText())
                    } catch {
                      /* permission denied: user can paste manually */
                    }
                  }}
                >
                  Paste
                </Button>
              )}
            </div>
            {parseError && (
              <>
                <Notice tone="warn">{parseError}</Notice>
                <Button size="sm" onClick={() => setReport(AiFeedbackSchema.parse({ scenario: scenario.title }))}>
                  Fill in the report by hand
                </Button>
              </>
            )}
            {warnings.map((w) => (
              <Notice key={w}>{w}</Notice>
            ))}
          </Card>
          {report && (
            <ReportReview
              key={JSON.stringify(report).length}
              initial={{ ...report, scenario: report.scenario || scenario.title }}
              scenarioId={scenario.id}
              raw={pasted}
              onDone={() => {
                setPasted('')
                setReport(null)
                saveDraft({ scenario: scenarioId, mode })
              }}
            />
          )}
        </section>
      </div>
    </div>
  )
}

function ReportReview({ initial, scenarioId, raw, onDone }: { initial: AiFeedback; scenarioId: string; raw: string; onDone: () => void }) {
  const { pack, lang, today } = useApp()
  const [r, setR] = useState<AiFeedback>(initial)
  const [minutes, setMinutes] = useState(15)
  const [keepMistake, setKeepMistake] = useState<boolean[]>(initial.mistakes.map(() => true))
  const [keepPhrase, setKeepPhrase] = useState<boolean[]>(initial.useful_phrases.map(() => true))
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const setMistake = (i: number, patch: Partial<AiFeedback['mistakes'][number]>) => setR({ ...r, mistakes: r.mistakes.map((m, j) => (j === i ? { ...m, ...patch } : m)) })
  const setPhrase = (i: number, patch: Partial<AiFeedback['useful_phrases'][number]>) => setR({ ...r, useful_phrases: r.useful_phrases.map((m, j) => (j === i ? { ...m, ...patch } : m)) })

  async function save() {
    setBusy(true)
    try {
      const reportId = newId()
      await db.aiReports.add({ id: reportId, lang, day: today, scenarioId, raw, report: r, createdAt: Date.now() })
      await db.conversations.add({
        id: newId(),
        lang,
        day: today,
        kind: 'ai-prompt',
        partner: 'AI role-play',
        durationMin: minutes,
        topics: r.scenario,
        newWords: [],
        notes: r.focus_tomorrow ? `Focus: ${r.focus_tomorrow}` : undefined,
        reportId,
        createdAt: Date.now(),
      })
      let m = 0
      let recurring = 0
      for (const [i, x] of r.mistakes.entries()) {
        if (!keepMistake[i] || !x.you_said.trim() || !x.correct.trim()) continue
        const res = await saveMistake({ lang, day: today, category: x.category, wrong: x.you_said, correct: x.correct, explanation: x.explanation, source: 'ai', sourceId: reportId }, true)
        m++
        if (res.recurring) recurring++
      }
      let p = 0
      for (const [i, x] of r.useful_phrases.entries()) {
        if (!keepPhrase[i] || !x.target.trim()) continue
        await addCard({ lang, target: x.target, en: x.en || '(from an AI role-play)', note: `From role-play: ${r.scenario}`, source: 'ai' })
        p++
      }
      setResult(
        `Saved. ${m} mistake${m === 1 ? '' : 's'} added to your journal as "fix it" cards${recurring ? ` (${recurring} recurring)` : ''}, ${p} phrase${p === 1 ? '' : 's'} added to your bank, and ${minutes} minutes logged.`,
      )
    } catch (e) {
      setError(storageErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (result)
    return (
      <Card className="pop-in space-y-4">
        <Notice tone="good" icon={<Check size={18} />}>
          {result}
        </Notice>
        {r.focus_tomorrow && (
          <p className="font-semibold">
            <strong>Focus for tomorrow:</strong> {r.focus_tomorrow}
          </p>
        )}
        <Button variant="primary" onClick={onDone}>
          Done
        </Button>
      </Card>
    )

  return (
    <Card className="space-y-5">
      <Eyebrow className="text-accent">3 · Check what gets added</Eyebrow>
      <div className="grid gap-3 sm:grid-cols-3">
        <TextInput label="Scenario" value={r.scenario} onChange={(e) => setR({ ...r, scenario: e.target.value })} />
        <Select label="Estimated level" value={r.level} onChange={(e) => setR({ ...r, level: e.target.value as AiFeedback['level'] })}>
          {LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </Select>
        <TextInput label="Minutes talked" type="number" inputMode="numeric" min={1} value={minutes || ''} onChange={(e) => setMinutes(Number(e.target.value) || 0)} />
      </div>

      {r.did_well.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-extrabold">What you did well</p>
          <ul className="list-disc pl-5 text-sm font-semibold">
            {r.did_well.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-extrabold">Mistakes → journal and "fix it" cards</p>
        {r.mistakes.map((m, i) => (
          <div key={i} className={cx('space-y-2 rounded-2xl p-3', keepMistake[i] ? 'bg-sunk' : 'bg-sunk opacity-50')}>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={keepMistake[i]} onChange={(e) => setKeepMistake(keepMistake.map((k, j) => (j === i ? e.target.checked : k)))} />
              Keep this one
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextInput label="You said" lang={lang} value={m.you_said} onChange={(e) => setMistake(i, { you_said: e.target.value })} />
              <TextInput label="Correct" lang={lang} value={m.correct} onChange={(e) => setMistake(i, { correct: e.target.value })} />
              <TextInput label="Why" value={m.explanation} onChange={(e) => setMistake(i, { explanation: e.target.value })} />
              <Select label="Type" value={m.category} onChange={(e) => setMistake(i, { category: e.target.value })}>
                {pack.mistakeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ))}
        <Button
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => {
            setR({ ...r, mistakes: [...r.mistakes, { you_said: '', correct: '', explanation: '', category: pack.mistakeCategories[0].id }] })
            setKeepMistake([...keepMistake, true])
          }}
        >
          Add a mistake
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-extrabold">Useful phrases → phrase bank</p>
        {r.useful_phrases.map((p, i) => (
          <div key={i} className={cx('flex flex-wrap items-end gap-2 rounded-2xl bg-sunk p-3', !keepPhrase[i] && 'opacity-50')}>
            <input
              type="checkbox"
              aria-label="Keep this phrase"
              className="mb-3 h-5 w-5 accent-[var(--accent)]"
              checked={keepPhrase[i]}
              onChange={(e) => setKeepPhrase(keepPhrase.map((k, j) => (j === i ? e.target.checked : k)))}
            />
            <div className="min-w-40 flex-1">
              <TextInput label={pack.name} lang={lang} value={p.target} onChange={(e) => setPhrase(i, { target: e.target.value })} />
            </div>
            <div className="min-w-40 flex-1">
              <TextInput label="English" value={p.en} onChange={(e) => setPhrase(i, { en: e.target.value })} />
            </div>
            {!p.target && (
              <button
                aria-label="Remove"
                className="mb-3 p-1 text-muted"
                onClick={() => {
                  setR({ ...r, useful_phrases: r.useful_phrases.filter((_, j) => j !== i) })
                  setKeepPhrase(keepPhrase.filter((_, j) => j !== i))
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        <Button
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => {
            setR({ ...r, useful_phrases: [...r.useful_phrases, { target: '', en: '' }] })
            setKeepPhrase([...keepPhrase, true])
          }}
        >
          Add a phrase
        </Button>
      </div>

      <TextInput label="Focus for tomorrow" value={r.focus_tomorrow} onChange={(e) => setR({ ...r, focus_tomorrow: e.target.value })} />
      {r.useful_phrases.length > 0 && (
        <p className="text-xs font-semibold text-muted">
          Tip: AI suggestions are usually good but not always. Give each phrase a quick read before saving it.
        </p>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
      <Button variant="good" size="lg" className="w-full" onClick={save} disabled={busy || minutes <= 0}>
        Save to my journal and phrases
      </Button>
    </Card>
  )
}
