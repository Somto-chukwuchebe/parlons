import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Bot, ChevronRight, Flag, History, Mic, Pause, Phone, Play, Star, Trash2, Waves } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, Eyebrow, PageHeader, Segmented, StatPill, TL } from '../components/ui'
import { SelfTalk } from '../components/session/Stages'
import { RecordingReview } from '../components/RecordingReview'
import { db, type RecordingKind, type RecordingRow } from '../db/schema'
import { playUrl, stopAudio } from '../lib/audio'
import { formatClock, formatDuration } from '../lib/session'
import { averageRating, speakingSeconds } from '../lib/stats'

const KIND_LABEL: Record<RecordingKind, string> = {
  speak: 'Speaking prompt',
  benchmark: 'Then and now',
  shadow: 'Shadowing',
  selftalk: 'Self-talk',
  fluency: 'Fluency check',
  script: 'Personal script',
  snapshot: 'Weekly snapshot',
}

type Filter = 'all' | 'answers' | 'shadow'

export function Speak() {
  const { lang } = useApp()
  const recordings = useLiveQuery(() => db.recordings.where('lang').equals(lang).reverse().sortBy('createdAt'), [lang], [])
  const conversations = useLiveQuery(() => db.conversations.where('lang').equals(lang).toArray(), [lang], [])
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string | null>(null)

  const total = speakingSeconds(recordings, conversations)
  const weekAgo = Date.now() - 7 * 86_400_000
  const recent = recordings.filter((r) => r.createdAt >= weekAgo)
  const avg = averageRating(recent)
  const shown = recordings.filter((r) => (filter === 'all' ? true : filter === 'shadow' ? r.kind === 'shadow' : r.kind !== 'shadow'))

  const byDay = useMemo(() => {
    const m = new Map<string, RecordingRow[]>()
    for (const r of shown) m.set(r.day, [...(m.get(r.day) ?? []), r])
    return [...m.entries()]
  }, [shown])

  return (
    <div>
      <PageHeader title="Speak" subtitle="Everything you've said out loud, and tools to say more." />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPill icon={<Mic size={22} />} value={formatDuration(total)} label="Spoken in total" tone="rouge" />
        <StatPill icon={<Mic size={22} />} value={recordings.length} label="Recordings" />
        <StatPill icon={<Star size={22} />} value={avg ?? '–'} label="Self-rating, 7 days" tone="gold" />
        <StatPill icon={<History size={22} />} value={conversations.length} label="Calls logged" tone="good" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <HubLink to="/shadowing" icon={<Waves size={26} />} title="Shadowing" text="Native speakers, A-B loops, record and compare." />
        <HubLink to="/then-and-now" icon={<History size={26} />} title="Then and now" text="Weeks 1, 4, 8 and 12, side by side." />
        <HubLink to="/roleplay" icon={<Bot size={26} />} title="AI role-play" text="Real situations with any AI chat, feedback into cards." />
        <HubLink to="/conversations" icon={<Phone size={26} />} title="Conversations" text="Log tutor and exchange calls, new words, confidence." />
        <HubLink to="/mistakes" icon={<Flag size={26} />} title="Mistake journal" text="What trips you up, and whether it's improving." />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black">Your recordings</h2>
            <div className="w-72">
              <Segmented
                label="Filter"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'answers', label: 'Answers' },
                  { value: 'shadow', label: 'Shadowing' },
                ]}
              />
            </div>
          </div>
          {byDay.length === 0 ? (
            <Card>
              <p className="py-6 text-center font-semibold text-muted">Nothing yet. Your first recording will appear here.</p>
            </Card>
          ) : (
            <div className="space-y-5">
              {byDay.map(([day, rows]) => (
                <div key={day}>
                  <Eyebrow className="mb-2">{format(new Date(day), 'EEEE d MMMM')}</Eyebrow>
                  <Card className="divide-y-2 divide-line p-0">
                    {rows.map((r) => (
                      <RecordingItem key={r.id} rec={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} />
                    ))}
                  </Card>
                </div>
              ))}
            </div>
          )}
        </section>
        <aside className="space-y-3">
          <h2 className="text-xl font-black">Quick self-talk</h2>
          <p className="text-sm font-semibold text-muted">60 seconds, any time: on the metro, while cooking, before bed.</p>
          <SelfTalk onRecorded={() => {}} />
        </aside>
      </div>
    </div>
  )
}

function HubLink({ to, icon, title, text }: { to: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Link to={to} className="press flex items-center gap-4 rounded-3xl border-2 border-line bg-surface p-5" style={{ '--lip': 'var(--line)' } as CSSProperties}>
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-black">{title}</span>
        <span className="block text-sm font-semibold text-muted">{text}</span>
      </span>
      <ChevronRight className="text-muted" />
    </Link>
  )
}

function RecordingItem({ rec, open, onToggle }: { rec: RecordingRow; open: boolean; onToggle: () => void }) {
  const [playing, setPlaying] = useState(false)
  const ratings = Object.values(rec.ratings ?? {}).filter((v): v is number => !!v)
  async function play() {
    if (playing) {
      stopAudio()
      return setPlaying(false)
    }
    setPlaying(true)
    const url = URL.createObjectURL(rec.blob)
    await playUrl(url)
    URL.revokeObjectURL(url)
    setPlaying(false)
  }
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <button onClick={play} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-on-accent" aria-label={playing ? 'Stop' : 'Play'}>
          {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>
        <button onClick={onToggle} className="min-w-0 flex-1 text-left" aria-expanded={open}>
          <span className="block text-xs font-extrabold tracking-wider text-muted uppercase">
            {KIND_LABEL[rec.kind]} · {formatClock(rec.durationSec)}
            {rec.wpm ? ` · ${rec.wpm} wpm` : ''}
          </span>
          {rec.promptText && <TL className="block font-bold">{rec.promptText}</TL>}
          {ratings.length > 0 && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 text-xs font-black text-gold-ink">
              <Star size={12} fill="currentColor" /> {(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)}
            </span>
          )}
        </button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Delete recording"
          onClick={async () => {
            if (confirm('Delete this recording?')) await db.recordings.delete(rec.id)
          }}
        >
          <Trash2 size={18} />
        </Button>
      </div>
      <div className={cx(open ? 'mt-3' : 'hidden')}>{open && <RecordingReview recording={rec} compact={rec.kind === 'shadow'} />}</div>
    </div>
  )
}
