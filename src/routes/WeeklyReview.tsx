import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Award, Check, ClipboardCopy, Download, History, Lightbulb } from 'lucide-react'
import { State } from 'ts-fsrs'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, Eyebrow, Notice, PageHeader, StatPill, TextArea, TL } from '../components/ui'
import { RatingRow } from '../components/RecordingReview'
import { db, updateSettings } from '../db/schema'
import { deliverBackup, exportBackup } from '../lib/backup'
import { recurringGroups } from '../lib/mistakes'
import { contentWeek, fromDayKey } from '../lib/program'
import { minutesByStage } from '../lib/progress'
import { STAGE_INFO } from '../lib/session'
import { speakingSeconds } from '../lib/stats'
import { totalsByDay } from '../lib/streak'
import { fillTemplate } from '../lib/template'
import { suggestStage } from '../lib/weekly'
import { BACKUP_REMINDER_DAYS } from '../config'

export function WeeklyReview() {
  const { pack, lang, plan, today, profile, settings } = useApp()
  const [params, setParams] = useSearchParams()
  const current = plan ? contentWeek(plan, today) : 1
  const weekNo = Math.min(12, Math.max(1, Number(params.get('week')) || current))
  const span = plan?.weeks[weekNo - 1]
  const week = pack.weeks[weekNo - 1]
  const inWeek = (d: string) => !!span && d >= span.start && d <= span.end
  const q = <T,>(f: () => Promise<T[]>) => useLiveQuery(f, [lang, weekNo], [] as T[])
  const sessions = q(() => db.sessions.where('lang').equals(lang).toArray())
  const recordings = q(() => db.recordings.where('lang').equals(lang).toArray())
  const conversations = q(() => db.conversations.where('lang').equals(lang).toArray())
  const logs = q(() => db.reviewLogs.where('lang').equals(lang).toArray())
  const mistakes = q(() => db.mistakes.where('lang').equals(lang).toArray())
  const ticks = q(() => db.canDo.where('[lang+week]').equals([lang, weekNo]).toArray())
  const existing = useLiveQuery(() => db.weeklyReviews.get(`${lang}-w${weekNo}`), [lang, weekNo])

  const [easier, setEasier] = useState('')
  const [harder, setHarder] = useState('')
  const [confidence, setConfidence] = useState<number | undefined>()
  const [selfRating, setSelfRating] = useState<number | undefined>()
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    setEasier(existing?.easier ?? '')
    setHarder(existing?.harder ?? '')
    setConfidence(existing?.confidence)
    setSelfRating(existing?.selfRating)
    setSaved(false)
  }, [existing, weekNo])

  const stats = useMemo(() => {
    const s = sessions.filter((x) => inWeek(x.day))
    const r = recordings.filter((x) => inWeek(x.day))
    const c = conversations.filter((x) => inWeek(x.day))
    const l = logs.filter((x) => inWeek(x.day))
    const m = mistakes.filter((x) => inWeek(x.day))
    const totals = totalsByDay(s)
    const pron = r.map((x) => x.ratings?.pronunciation).filter((x): x is number => !!x)
    const reviewsOnly = l.filter((x) => x.state !== State.New)
    const byCat: Record<string, number> = {}
    for (const x of m) byCat[x.category] = (byCat[x.category] ?? 0) + 1
    const stageMinutes = minutesByStage(s)
    return {
      studyMinutes: Math.round([...totals.values()].reduce((a, b) => a + b, 0) / 60),
      daysStudied: [...totals.values()].filter((v) => v >= 600).length,
      speakingMinutes: Math.round(speakingSeconds(r, c) / 60),
      recordings: r.length,
      phrasesSaid: l.length,
      againRate: reviewsOnly.length >= 5 ? reviewsOnly.filter((x) => x.rating === 1).length / reviewsOnly.length : null,
      calls: c.filter((x) => x.kind === 'tutor' || x.kind === 'exchange').length,
      rolePlays: c.filter((x) => x.kind.startsWith('ai')).length,
      mistakes: m,
      byCat,
      stageMinutes,
      avgPron: pron.length ? pron.reduce((a, b) => a + b, 0) / pron.length : null,
      suggestion: suggestStage({
        studyMinutes: 0,
        stageMinutes,
        recordingsCount: r.length,
        avgPronunciation: pron.length ? pron.reduce((a, b) => a + b, 0) / pron.length : null,
        againRate: reviewsOnly.length >= 5 ? reviewsOnly.filter((x) => x.rating === 1).length / reviewsOnly.length : null,
        mistakesByCategory: byCat,
        callsOrRolePlays: c.length,
        daysStudied: [...totals.values()].filter((v) => v >= 600).length,
      }),
    }
  }, [sessions, recordings, conversations, logs, mistakes, span?.start])

  const recurring = recurringGroups(stats.mistakes).slice(0, 3)
  const ticked = new Set(ticks.map((t) => t.index))
  const label = (id: string) => pack.mistakeCategories.find((c) => c.id === id)?.label ?? id
  const backupDue = !settings.lastBackupAt || Date.now() - settings.lastBackupAt > BACKUP_REMINDER_DAYS * 86_400_000

  async function toggle(i: number) {
    const id = `${lang}-w${weekNo}-${i}`
    if (ticked.has(i)) await db.canDo.delete(id)
    else await db.canDo.put({ id, lang, week: weekNo, index: i, checkedAt: Date.now() })
  }

  async function save() {
    await db.weeklyReviews.put({
      id: `${lang}-w${weekNo}`,
      lang,
      week: weekNo,
      day: today,
      easier,
      harder,
      confidence: confidence ?? 0,
      selfRating: selfRating ?? 0,
      suggestion: `${stats.suggestion.stage}: ${stats.suggestion.reason}`,
      createdAt: existing?.createdAt ?? Date.now(),
    })
    setSaved(true)
  }

  const summary = [
    `- Studied ${stats.studyMinutes} minutes on ${stats.daysStudied} days (target: ${profile?.dailyMinutes ?? 30} min/day).`,
    `- Speaking on record: ${stats.speakingMinutes} minutes, ${stats.recordings} recordings, ${stats.calls} calls, ${stats.rolePlays} AI role-plays.`,
    `- Phrases said out loud in review: ${stats.phrasesSaid}${stats.againRate !== null ? ` ("Again" on ${Math.round(stats.againRate * 100)}%)` : ''}.`,
    `- Minutes by stage: ${Object.entries(stats.stageMinutes).map(([k, v]) => `${STAGE_INFO[k as keyof typeof STAGE_INFO].title} ${v}`).join(', ')}.`,
    `- Mistakes logged: ${stats.mistakes.length}${Object.keys(stats.byCat).length ? ` (${Object.entries(stats.byCat).map(([k, v]) => `${label(k)} ${v}`).join(', ')})` : ''}.`,
    ...recurring.map((g) => `- Recurring: "${g[g.length - 1].wrong}" → "${g[0].correct}" (${g.length}×)`),
    `- Can-do goals ticked: ${ticked.size} of ${week.canDo.length}.`,
  ].join('\n')

  const aiPrompt = fillTemplate(pack.aiTemplates.weeklyReview, {
    week: weekNo,
    theme: week.theme,
    grammar: week.grammar,
    summary,
    easier: easier || '(not filled in)',
    harder: harder || '(not filled in)',
    confidence: confidence ?? '(not rated)',
    dailyMinutes: profile?.dailyMinutes ?? 30,
  })

  if (!span) return null

  return (
    <div className="space-y-6">
      <PageHeader
        back="/progress"
        title={`Week ${weekNo} review`}
        subtitle={`${week.theme} · ${format(fromDayKey(span.start), 'd MMM')} – ${format(fromDayKey(span.end), 'd MMM')}`}
        actions={
          <div className="flex gap-1">
            {weekNo > 1 && <Button size="sm" onClick={() => setParams({ week: String(weekNo - 1) })}>← W{weekNo - 1}</Button>}
            {weekNo < current && <Button size="sm" onClick={() => setParams({ week: String(weekNo + 1) })}>W{weekNo + 1} →</Button>}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPill icon={<History size={22} />} value={`${stats.studyMinutes} min`} label={`Studied, ${stats.daysStudied} days`} />
        <StatPill icon={<Award size={22} />} value={`${stats.speakingMinutes} min`} label="Spoken on record" tone="rouge" />
        <StatPill icon={<Check size={22} />} value={stats.phrasesSaid} label="Phrases said aloud" tone="good" />
        <StatPill icon={<Lightbulb size={22} />} value={stats.mistakes.length} label="Mistakes logged" tone="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <Eyebrow className="text-accent">Can you do these now?</Eyebrow>
          <ul className="space-y-2">
            {week.canDo.map((c, i) => (
              <li key={c}>
                <button
                  role="checkbox"
                  aria-checked={ticked.has(i)}
                  onClick={() => toggle(i)}
                  className={cx('flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left font-semibold', ticked.has(i) ? 'border-gold bg-gold-soft' : 'border-line bg-surface')}
                >
                  <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-full', ticked.has(i) ? 'pop-in bg-gold text-[#3d2a00]' : 'border-2 border-dashed border-line text-muted')}>
                    <Award size={16} />
                  </span>
                  {c}
                </button>
              </li>
            ))}
          </ul>
          <p className="text-xs font-semibold text-muted">Only tick a goal if you could do it today in a real conversation, without notes.</p>
        </Card>

        <Card className="space-y-4">
          <Eyebrow className="text-accent">Your check-in</Eyebrow>
          <TextArea label="What felt easier this week?" rows={2} value={easier} onChange={(e) => setEasier(e.target.value)} />
          <TextArea label="What felt hard?" rows={2} value={harder} onChange={(e) => setHarder(e.target.value)} />
          <RatingRow label="Confidence speaking" hint="1 = anxious · 5 = relaxed" value={confidence} onChange={setConfidence} />
          <RatingRow label="Overall speaking this week" hint="1 = struggled · 5 = flowed" value={selfRating} onChange={setSelfRating} />
          <Button variant="primary" className="w-full" onClick={save} disabled={!confidence || !selfRating}>
            {existing ? 'Update check-in' : 'Save check-in'}
          </Button>
          {saved && <Notice tone="good">Saved. It's on your progress chart now.</Notice>}
        </Card>
      </div>

      <Card className="space-y-3 border-accent bg-accent-soft">
        <Eyebrow className="text-accent">Suggestion for next week</Eyebrow>
        <p className="text-xl font-black">Give {STAGE_INFO[stats.suggestion.stage].title} a bit more time</p>
        <p className="font-semibold">{stats.suggestion.reason}</p>
      </Card>

      {recurring.length > 0 && (
        <Card className="space-y-2">
          <Eyebrow>Top recurring mistakes this week</Eyebrow>
          {recurring.map((g) => (
            <p key={g[0].id}>
              <span className="text-again line-through">
                <TL>{g[g.length - 1].wrong}</TL>
              </span>{' '}
              → <TL className="font-black">{g[0].correct}</TL> <span className="text-sm font-bold text-muted">×{g.length}</span>
            </p>
          ))}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          <Eyebrow>Optional: ask an AI coach</Eyebrow>
          <p className="text-sm font-semibold text-muted">Copies a prompt with this week's numbers and your check-in, for any AI chat assistant.</p>
          <Button
            icon={copied ? <Check size={18} /> : <ClipboardCopy size={18} />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(aiPrompt)
                setCopied(true)
              } catch {
                alert('Copying was blocked; open "Show the prompt" and copy it by hand.')
              }
            }}
          >
            {copied ? 'Copied!' : 'Copy AI weekly-review prompt'}
          </Button>
          <details>
            <summary className="cursor-pointer text-sm font-extrabold text-accent">Show the prompt</summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-2xl bg-sunk p-3 text-xs whitespace-pre-wrap">{aiPrompt}</pre>
          </details>
        </Card>
        <Card className="space-y-3">
          <Eyebrow>Also this Sunday</Eyebrow>
          <Link to="/then-and-now" className="block font-extrabold text-accent underline">
            Record your 2-minute weekly snapshot
          </Link>
          <p className={cx('text-sm font-semibold', backupDue ? 'text-warn-ink' : 'text-muted')}>
            {settings.lastBackupAt ? `Last backup ${format(settings.lastBackupAt, 'd MMM')}.` : 'No backup yet.'} A weekly backup keeps your recordings safe.
          </p>
          <Button
            variant={backupDue ? 'primary' : 'secondary'}
            icon={<Download size={18} />}
            onClick={async () => {
              try {
                await deliverBackup(await exportBackup())
                await updateSettings({ lastBackupAt: Date.now() })
              } catch {
                /* cancelled share sheet */
              }
            }}
          >
            Back up now
          </Button>
        </Card>
      </div>
    </div>
  )
}
