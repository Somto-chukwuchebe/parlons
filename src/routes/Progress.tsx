import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, CalendarDays, Clock, Flame, Layers, Mic, Phone, Target, Trophy } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Card, cx, PageHeader, StatPill } from '../components/ui'
import { db, type StageId } from '../db/schema'
import { heatmap, minutesByStage, phraseCounts, retentionRate, speakingMetrics, weeklyStats, type HeatCell } from '../lib/progress'
import { contentWeek, fromDayKey } from '../lib/program'
import { SPEAKING_STAGES, STAGE_INFO } from '../lib/session'
import { currentStreak, longestStreak, totalsByDay } from '../lib/streak'

// The honest dashboard: time, speaking, memory, mistakes and goals.

export default function Progress() {
  const { pack, lang, plan, profile, today } = useApp()
  const q = <T,>(f: () => Promise<T[]>) => useLiveQuery(f, [lang], [] as T[])
  const sessions = q(() => db.sessions.where('lang').equals(lang).toArray())
  const recordings = q(() => db.recordings.where('lang').equals(lang).toArray())
  const conversations = q(() => db.conversations.where('lang').equals(lang).toArray())
  const cards = q(() => db.cards.where('lang').equals(lang).toArray())
  const logs = q(() => db.reviewLogs.where('lang').equals(lang).toArray())
  const mistakes = q(() => db.mistakes.where('lang').equals(lang).toArray())
  const reviews = q(() => db.weeklyReviews.where('lang').equals(lang).toArray())
  const canDo = q(() => db.canDo.where('lang').equals(lang).toArray())

  const data = useMemo(() => {
    if (!plan || !profile) return null
    const totals = totalsByDay(sessions)
    return {
      heat: heatmap(plan, sessions, profile.dailyMinutes, today),
      streak: currentStreak(totals, today),
      longest: longestStreak(totals),
      studyMinutes: Math.round([...totals.values()].reduce((a, b) => a + b, 0) / 60),
      stages: minutesByStage(sessions),
      retention: retentionRate(logs),
      phrases: phraseCounts(cards),
      speaking: speakingMetrics(recordings, conversations),
      weeks: weeklyStats(plan, { sessions, recordings, conversations, mistakes, reviews }),
    }
  }, [plan, profile, sessions, recordings, conversations, cards, logs, mistakes, reviews, today])

  if (!data || !plan) return null
  const currentWeek = contentWeek(plan, today)
  const weeksSoFar = data.weeks.filter((w) => w.week <= currentWeek)

  return (
    <div className="space-y-8">
      <PageHeader title="Progress" subtitle="Honest numbers: what you did, how much you spoke, and what's sticking." />

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPill icon={<Mic size={22} />} value={`${data.speaking.totalMinutes} min`} label="Spoken on record" tone="rouge" />
        <StatPill icon={<Flame size={22} />} value={`${data.streak} / ${data.longest}`} label="Streak · best" tone="rouge" />
        <StatPill icon={<Trophy size={22} />} value={`${data.phrases.learned} / ${data.phrases.total}`} label="Phrases learned" tone="good" />
        <StatPill icon={<Target size={22} />} value={data.retention === null ? '–' : `${Math.round(data.retention * 100)}%`} label="Retention" />
      </div>

      <Card>
        <SectionHead icon={<CalendarDays size={20} />} title="Every day of the programme" note={`${data.studyMinutes} minutes studied in total, including any practice before day 1`} />
        <Heatmap cells={data.heat} target={profile!.dailyMinutes} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHead icon={<Clock size={20} />} title="Minutes by stage" note="Speaking stages highlighted" />
          <StageBars stages={data.stages} />
        </Card>
        <Card>
          <SectionHead icon={<Mic size={20} />} title="Speaking per week" note="Minutes on record: recordings and calls" />
          <WeeklyBar data={weeksSoFar.map((w) => ({ label: `W${w.week}`, value: w.speakingMinutes }))} unit="min" />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHead icon={<Award size={20} />} title="How you rate your speaking" note="From your Sunday check-ins, 1–5" />
          <RatingLines data={weeksSoFar.map((w) => ({ label: `W${w.week}`, self: w.selfRating ?? null, confidence: w.confidence ?? null }))} />
        </Card>
        <Card>
          <SectionHead icon={<Phone size={20} />} title="Conversation and fluency" />
          <dl className="grid grid-cols-2 gap-4">
            <Metric label="Calls with people" value={data.speaking.calls} />
            <Metric label="Minutes with people" value={data.speaking.callMinutes} />
            <Metric label="Longest conversation" value={data.speaking.longestConversation ? `${data.speaking.longestConversation} min` : '–'} />
            <Metric label="Words per minute" value={data.speaking.avgWpm ?? '–'} hint="from transcripts and pronunciation checks" />
            <Metric label="Words per turn" value={data.speaking.avgWordsPerTurn ?? '–'} hint="where a transcript exists" />
            <Metric label="Minutes recorded" value={data.speaking.recordedMinutes} />
          </dl>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHead icon={<Layers size={20} />} title="Mistakes over time" note="By type, per course week" />
          <MistakeMultiples pack={pack} mistakes={mistakes} plan={plan} upto={currentWeek} />
          <Link to="/mistakes" className="mt-3 inline-block text-sm font-extrabold text-accent underline">
            Open the mistake journal
          </Link>
        </Card>
        <Card>
          <SectionHead icon={<Target size={20} />} title="Can-do goals" note="Ticked in your weekly reviews" />
          <ul className="space-y-2">
            {pack.weeks.slice(0, Math.max(currentWeek, 1)).map((w) => {
              const n = canDo.filter((c) => c.week === w.week).length
              return (
                <li key={w.week} className="flex items-center gap-3">
                  <span className="w-10 text-sm font-extrabold text-muted">W{w.week}</span>
                  <span className="h-3 flex-1 overflow-hidden rounded-full bg-sunk" role="img" aria-label={`Week ${w.week}: ${n} of ${w.canDo.length} goals`}>
                    <span className="block h-full rounded-full bg-gold" style={{ width: `${(n / w.canDo.length) * 100}%` }} />
                  </span>
                  <span className="w-10 text-right text-sm font-extrabold tabular-nums">
                    {n}/{w.canDo.length}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <details className="rounded-3xl border-2 border-line bg-surface p-5">
        <summary className="cursor-pointer font-extrabold">Show the weekly numbers as a table</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="py-2 pr-3">Week</th>
                <th className="pr-3">Dates</th>
                <th className="pr-3 text-right">Study min</th>
                <th className="pr-3 text-right">Speaking min</th>
                <th className="pr-3 text-right">Mistakes</th>
                <th className="pr-3 text-right">Self-rating</th>
                <th className="text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-line font-semibold tabular-nums">
              {weeksSoFar.map((w) => (
                <tr key={w.week}>
                  <td className="py-2 pr-3 font-extrabold">W{w.week}</td>
                  <td className="pr-3">
                    {format(fromDayKey(w.start), 'd MMM')}–{format(fromDayKey(w.end), 'd MMM')}
                  </td>
                  <td className="pr-3 text-right">{w.studyMinutes}</td>
                  <td className="pr-3 text-right">{w.speakingMinutes}</td>
                  <td className="pr-3 text-right">{w.mistakes}</td>
                  <td className="pr-3 text-right">{w.selfRating ?? '–'}</td>
                  <td className="text-right">{w.confidence ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

function SectionHead({ icon, title, note }: { icon: ReactNode; title: string; note?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
      <div>
        <h2 className="text-lg font-black leading-tight">{title}</h2>
        {note && <p className="text-sm font-semibold text-muted">{note}</p>}
      </div>
    </div>
  )
}

function Metric({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div>
      <dt className="text-xs font-extrabold tracking-wider text-muted uppercase">{label}</dt>
      <dd className="text-2xl font-black tabular-nums">{value}</dd>
      {hint && <p className="text-xs font-semibold text-muted">{hint}</p>}
    </div>
  )
}

function Heatmap({ cells, target }: { cells: HeatCell[]; target: number }) {
  const [hover, setHover] = useState<HeatCell | null>(null)
  // Columns are Monday-start weeks; pad the first column so rows line up with weekdays.
  const offset = (fromDayKey(cells[0].day).getDay() + 6) % 7
  const padded: (HeatCell | null)[] = [...Array(offset).fill(null), ...cells]
  const cols = Math.ceil(padded.length / 7)
  const studied = cells.filter((c) => c.minutes > 0).length
  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="grid w-max grid-flow-col gap-1" style={{ gridTemplateRows: 'repeat(7, 1rem)', gridTemplateColumns: `repeat(${cols}, 1rem)` }} role="img" aria-label={`Study heatmap: ${studied} of ${cells.length} days with study so far`}>
          {padded.map((c, i) =>
            c ? (
              <button
                key={c.day}
                onMouseEnter={() => setHover(c)}
                onFocus={() => setHover(c)}
                onMouseLeave={() => setHover(null)}
                className={cx('h-4 w-4 rounded-[4px]', c.future && 'opacity-40')}
                style={{ background: `var(--heat-${c.level})` }}
                aria-label={`${format(fromDayKey(c.day), 'EEE d MMM')}: ${c.minutes} minutes`}
              />
            ) : (
              <span key={`pad-${i}`} />
            ),
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-muted">
        <span aria-live="polite" className="min-h-5 text-sm text-ink">
          {hover ? `${format(fromDayKey(hover.day), 'EEEE d MMMM')}: ${hover.minutes} min` : `${studied} day${studied === 1 ? '' : 's'} studied so far`}
        </span>
        <span className="flex items-center gap-1">
          0
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="h-3 w-3 rounded-[3px]" style={{ background: `var(--heat-${l})` }} />
          ))}
          {target}+ min
        </span>
      </div>
    </div>
  )
}

function StageBars({ stages }: { stages: Record<StageId, number> }) {
  const max = Math.max(1, ...Object.values(stages))
  const order: StageId[] = ['review', 'structure', 'shadowing', 'speak', 'conversation']
  return (
    <div>
      <ul className="space-y-3">
        {order.map((s) => {
          const speaking = SPEAKING_STAGES.includes(s)
          return (
            <li key={s} title={`${STAGE_INFO[s].title}: ${stages[s]} min`}>
              <div className="mb-1 flex justify-between text-sm font-extrabold">
                <span>{STAGE_INFO[s].title}</span>
                <span className="tabular-nums text-muted">{stages[s]} min</span>
              </div>
              <div className="h-3 rounded-full bg-sunk">
                <div className="h-full rounded-full" style={{ width: `${(stages[s] / max) * 100}%`, background: speaking ? 'var(--chart-2)' : 'var(--chart-1)', minWidth: stages[s] ? 6 : 0 }} />
              </div>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 flex gap-4 text-xs font-bold text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--chart-2)' }} /> Speaking stages
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--chart-1)' }} /> Input stages
        </span>
      </p>
    </div>
  )
}

const axis = { fontSize: 12, fill: 'var(--muted)', fontWeight: 700 }
const tooltipStyle = { background: 'var(--surface)', border: '2px solid var(--line)', borderRadius: 12, fontWeight: 700, color: 'var(--ink)' }

function WeeklyBar({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  if (!data.some((d) => d.value > 0)) return <Empty text="Record answers or log calls, and this fills in week by week." />
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'var(--sunk)' }} contentStyle={tooltipStyle} formatter={(v) => [`${v} ${unit}`, 'Speaking']} />
          <Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RatingLines({ data }: { data: { label: string; self: number | null; confidence: number | null }[] }) {
  if (!data.some((d) => d.self || d.confidence)) return <Empty text="Your Sunday check-ins will draw this line." />
  return (
    <div className="h-56">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={axis} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, fontWeight: 800 }} />
          <Line type="monotone" dataKey="self" name="Speaking self-rating" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 4 }} connectNulls />
          <Line type="monotone" dataKey="confidence" name="Confidence" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 4 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function MistakeMultiples({ pack, mistakes, plan, upto }: { pack: ReturnType<typeof useApp>['pack']; mistakes: { day: string; category: string }[]; plan: NonNullable<ReturnType<typeof useApp>['plan']>; upto: number }) {
  const weeks = plan.weeks.filter((w) => w.week <= Math.max(upto, 1))
  const rows = pack.mistakeCategories
    .map((c) => ({ ...c, counts: weeks.map((w) => mistakes.filter((m) => m.category === c.id && m.day >= w.start && m.day <= w.end).length) }))
    .filter((r) => r.counts.some(Boolean))
  if (!rows.length) return <Empty text="No mistakes logged yet." />
  const max = Math.max(1, ...rows.flatMap((r) => r.counts))
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm font-extrabold">{r.label}</span>
          <span className="flex h-8 flex-1 items-end gap-0.5" role="img" aria-label={`${r.label} per week: ${r.counts.join(', ')}`}>
            {r.counts.map((n, i) => (
              <span key={i} className="flex-1 rounded-t-[3px]" title={`Week ${weeks[i].week}: ${n}`} style={{ height: `${Math.max(8, (n / max) * 100)}%`, background: n ? 'var(--chart-1)' : 'var(--sunk)' }} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Empty({ text = 'Nothing yet: this fills in as you study.' }: { text?: string }) {
  return <p className="grid h-40 place-items-center text-center text-sm font-semibold text-muted">{text}</p>
}
