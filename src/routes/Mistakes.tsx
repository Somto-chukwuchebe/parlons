import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Plus, Repeat } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, Eyebrow, PageHeader, TL } from '../components/ui'
import { MistakeForm } from '../components/RecordingReview'
import { db } from '../db/schema'
import { categoryTrends, recurringGroups, type CategoryTrend } from '../lib/mistakes'
import { fromDayKey } from '../lib/program'

const SOURCE: Record<string, string> = { recording: 'recording', conversation: 'call', ai: 'AI role-play', manual: 'added by hand' }

export function Mistakes() {
  const { pack, lang, today } = useApp()
  const rows = useLiveQuery(() => db.mistakes.where('lang').equals(lang).toArray(), [lang], [])
  const [open, setOpen] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const trends = categoryTrends(rows, pack.mistakeCategories.map((c) => c.id), today)
  const recurring = recurringGroups(rows).slice(0, 6)
  const label = (id: string) => pack.mistakeCategories.find((c) => c.id === id)?.label ?? id

  return (
    <div>
      <PageHeader
        back="/speak"
        title="Mistake journal"
        subtitle="What trips you up, and whether it's getting better. Mistakes are how you learn; logging them makes them stick."
        actions={
          <Button icon={<Plus size={20} />} onClick={() => setAdding(!adding)}>
            Add a mistake
          </Button>
        }
      />
      {adding && (
        <div className="mb-6 max-w-xl">
          <MistakeForm day={today} source="manual" onDone={() => setAdding(false)} />
        </div>
      )}

      {rows.length === 0 ? (
        <Card>
          <p className="py-6 text-center font-semibold text-muted">
            No mistakes logged yet. Tag them after a recording, a call, or paste back an AI role-play report.
          </p>
        </Card>
      ) : (
        <>
          {recurring.length > 0 && (
            <section className="mb-8">
              <Eyebrow className="mb-2">Recurring: these keep coming back</Eyebrow>
              <div className="grid gap-3 sm:grid-cols-2">
                {recurring.map((g) => (
                  <Card key={g[0].id} className="border-hard/40 bg-warn-bg">
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface font-black text-warn-ink">×{g.length}</span>
                      <div className="min-w-0 text-sm">
                        <p className="text-xs font-extrabold tracking-wider text-warn-ink uppercase">{label(g[0].category)}</p>
                        <p>
                          <span className="text-again line-through">
                            <TL>{g[g.length - 1].wrong}</TL>
                          </span>{' '}
                          → <TL className="font-black">{g[0].correct}</TL>
                        </p>
                        {g.find((m) => m.explanation) && <p className="mt-1 font-semibold text-warn-ink">{g.find((m) => m.explanation)!.explanation}</p>}
                        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-warn-ink">
                          <Repeat size={12} /> Extra "fix it" cards are in your reviews.
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <Eyebrow className="mb-2">By type · last 2 weeks vs the 2 before</Eyebrow>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trends.filter((t) => t.total > 0).sort((a, b) => b.recent - a.recent || b.total - a.total).map((t) => (
              <TrendCard key={t.category} trend={t} label={label(t.category)} hint={pack.mistakeCategories.find((c) => c.id === t.category)?.hint ?? ''} open={open === t.category} onToggle={() => setOpen(open === t.category ? null : t.category)} />
            ))}
          </div>
          {trends.some((t) => t.total === 0) && (
            <p className="mt-3 text-sm font-semibold text-muted">
              No mistakes logged yet in: {trends.filter((t) => t.total === 0).map((t) => label(t.category)).join(', ')}.
            </p>
          )}

          {open && (
            <Card className="mt-6">
              <h2 className="mb-3 text-xl font-black">{label(open)}</h2>
              <ul className="divide-y-2 divide-line">
                {rows
                  .filter((m) => m.category === open)
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((m) => (
                    <li key={m.id} className="py-3">
                      <p>
                        <span className="text-again line-through">
                          <TL>{m.wrong}</TL>
                        </span>{' '}
                        → <TL className="font-black text-good">{m.correct}</TL>
                      </p>
                      {m.explanation && <p className="text-sm font-semibold text-muted">{m.explanation}</p>}
                      <p className="text-xs font-bold text-muted">
                        {format(fromDayKey(m.day), 'd MMM')} · from a {SOURCE[m.source] ?? m.source}
                        {m.cardId ? ' · practising as a card' : ''}
                      </p>
                    </li>
                  ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function TrendCard({ trend, label, hint, open, onToggle }: { trend: CategoryTrend; label: string; hint: string; open: boolean; onToggle: () => void }) {
  const max = Math.max(1, ...trend.weekly.map((w) => w.count))
  const Arrow = trend.direction === 'up' ? ArrowUpRight : trend.direction === 'down' ? ArrowDownRight : ArrowRight
  return (
    <button
      onClick={onToggle}
      disabled={trend.total === 0}
      aria-expanded={open}
      className={cx('rounded-3xl border-2 bg-surface p-4 text-left disabled:opacity-60', open ? 'border-accent' : 'border-line')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-black">{label}</p>
          <p className="truncate text-xs font-semibold text-muted">{hint}</p>
        </div>
        {trend.total > 0 && (
          <span
            className={cx(
              'flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-black',
              trend.direction === 'up' ? 'bg-rouge-soft text-rouge' : trend.direction === 'down' ? 'bg-good-soft text-good' : 'bg-sunk text-muted',
            )}
          >
            <Arrow size={14} />
            {trend.recent} vs {trend.before}
          </span>
        )}
      </div>
      <div className="mt-3 flex h-10 items-end gap-1" aria-label={`Last 6 weeks: ${trend.weekly.map((w) => w.count).join(', ')}`} role="img">
        {trend.weekly.map((w) => (
          <span key={w.week} className="flex-1 rounded-t-md bg-accent/70" style={{ height: `${Math.max(6, (w.count / max) * 100)}%`, opacity: w.count ? 1 : 0.2 }} />
        ))}
      </div>
      <p className="mt-2 text-xs font-bold text-muted">
        {trend.total} in total · {trend.direction === 'down' ? 'going down' : trend.direction === 'up' ? 'going up' : 'steady'}
      </p>
    </button>
  )
}
