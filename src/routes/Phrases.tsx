import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { formatDistanceToNowStrict } from 'date-fns'
import { Layers, Plus, Search, Sparkles, Trophy, Volume2 } from 'lucide-react'
import { State } from 'ts-fsrs'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, LinkButton, PageHeader, Segmented, StatPill, TL } from '../components/ui'
import { QuickAddDialog } from '../components/QuickAdd'
import { db, type CardRow } from '../db/schema'
import { contentWeek } from '../lib/program'
import { ensureDeck } from '../lib/srs'
import { speak } from '../lib/tts'

type Filter = 'all' | 'due' | 'new' | 'mine'

// A card counts as "learned" once FSRS expects you to remember it for three weeks or more.
const LEARNED_STABILITY_DAYS = 21

export function Phrases() {
  const { lang, pack, plan, today, profile } = useApp()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const cards = useLiveQuery(() => db.cards.where('lang').equals(lang).toArray(), [lang], [])

  useEffect(() => {
    if (plan && profile?.seedApprovedAt) void ensureDeck(pack, contentWeek(plan, today))
  }, [pack, plan, today, profile?.seedApprovedAt])

  const now = Date.now()
  const active = cards.filter((c) => !c.suspended)
  const due = active.filter((c) => c.fsrs.state !== State.New && c.due <= now)
  const fresh = active.filter((c) => c.fsrs.state === State.New)
  const learned = active.filter((c) => c.fsrs.stability >= LEARNED_STABILITY_DAYS)

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return active
      .filter((c) =>
        filter === 'due' ? c.fsrs.state !== State.New && c.due <= now : filter === 'new' ? c.fsrs.state === State.New : filter === 'mine' ? c.source !== 'seed' && c.source !== 'repair' : true,
      )
      .filter((c) => !needle || c.target.toLowerCase().includes(needle) || c.en.toLowerCase().includes(needle))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.createdAt - b.createdAt)
  }, [active, filter, q, now])

  return (
    <div>
      <PageHeader
        title="Phrases"
        subtitle="Your spoken phrase bank, scheduled by spaced repetition."
        actions={
          <>
            <Button icon={<Plus size={20} />} onClick={() => setAdding(true)}>
              Add
            </Button>
            <LinkButton to="/review" variant="primary" icon={<Layers size={20} />}>
              Review now
            </LinkButton>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPill icon={<Layers size={22} />} value={due.length} label="Due for review" />
        <StatPill icon={<Sparkles size={22} />} value={fresh.length} label="Not started yet" tone="gold" />
        <StatPill icon={<Trophy size={22} />} value={learned.length} label="Learned" tone="good" />
        <StatPill icon={<Volume2 size={22} />} value={active.length} label="In your bank" tone="rouge" />
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search phrases</span>
            <Search size={20} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search in French or English"
              className="min-h-12 w-full rounded-2xl border-2 border-line bg-surface pr-4 pl-12 font-semibold focus:border-accent focus:outline-none"
            />
          </label>
          <div className="sm:w-96">
            <Segmented
              label="Filter"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'due', label: 'Due' },
                { value: 'new', label: 'New' },
                { value: 'mine', label: 'Mine' },
              ]}
            />
          </div>
        </div>

        {cards.length === 0 ? (
          <p className="py-8 text-center font-semibold text-muted">
            {profile?.seedApprovedAt ? 'Preparing your phrases…' : 'Approve your course first; your phrases appear here week by week.'}
          </p>
        ) : shown.length === 0 ? (
          <p className="py-8 text-center font-semibold text-muted">Nothing matches.</p>
        ) : (
          <ul className="divide-y-2 divide-line">
            {shown.slice(0, 300).map((c) => (
              <PhraseRow key={c.id} card={c} now={now} />
            ))}
          </ul>
        )}
        {shown.length > 300 && <p className="text-center text-sm font-bold text-muted">Showing 300 of {shown.length}. Search to narrow down.</p>}
      </Card>

      {adding && <QuickAddDialog onClose={() => setAdding(false)} />}
    </div>
  )
}

function PhraseRow({ card, now }: { card: CardRow; now: number }) {
  const { pack, profile } = useApp()
  const text = card.target.replace(/\[\[(.+?)\]\]/g, '$1')
  const status =
    card.fsrs.state === State.New
      ? { label: 'New', cls: 'bg-gold-soft text-gold-ink' }
      : card.due <= now
        ? { label: 'Due', cls: 'bg-accent-soft text-accent' }
        : { label: `in ${formatDistanceToNowStrict(card.due)}`, cls: 'bg-sunk text-muted' }
  return (
    <li className="flex items-start gap-3 py-3">
      <button
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"
        aria-label="Listen"
        onClick={() => speak(text, { locale: pack.speech.locale, voiceURI: profile?.voiceURI, rate: profile?.ttsRate })}
      >
        <Volume2 size={20} />
      </button>
      <div className="min-w-0 flex-1">
        <TL className="text-[17px] font-bold">{text}</TL>
        <span className="block text-sm font-semibold text-muted">{card.en}</span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-black whitespace-nowrap', status.cls)}>{status.label}</span>
        <span className="text-xs font-bold text-muted">
          {card.kind === 'cloze' ? 'Gap' : card.kind === 'error' ? 'Fix' : card.source === 'seed' || card.source === 'repair' ? `W${card.week ?? '–'}` : 'Mine'}
        </span>
      </div>
    </li>
  )
}
