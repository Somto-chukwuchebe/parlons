import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { Bot, Clock, Phone, Plus, Smile, Users } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, PageHeader, StatPill } from '../components/ui'
import { ConversationForm } from '../components/ConversationForm'
import { db, type ConversationRow } from '../db/schema'
import { fromDayKey } from '../lib/program'

const KIND: Record<ConversationRow['kind'], string> = {
  tutor: 'Tutor',
  exchange: 'Language exchange',
  'ai-prompt': 'AI role-play',
  'ai-voice': 'AI voice',
  selftalk: 'Self-talk',
}

export function Conversations() {
  const { lang } = useApp()
  const rows = useLiveQuery(() => db.conversations.where('lang').equals(lang).toArray(), [lang], [])
  // `key` stays the same when a new call is first saved, so the form isn't remounted mid-edit.
  const [editing, setEditing] = useState<{ key: string; id?: string } | null>(null)
  const sorted = [...rows].sort((a, b) => b.day.localeCompare(a.day) || b.createdAt - a.createdAt)
  const people = rows.filter((r) => r.kind === 'tutor' || r.kind === 'exchange')
  const peopleMin = people.reduce((n, r) => n + r.durationMin, 0)
  const conf = people.filter((r) => r.confidence).map((r) => r.confidence!)
  const avgConf = conf.length ? (conf.reduce((a, b) => a + b, 0) / conf.length).toFixed(1) : '–'

  return (
    <div>
      <PageHeader
        back="/speak"
        title="Conversations"
        subtitle="Calls with tutors and language partners, plus AI role-plays."
        actions={
          <Button variant="primary" icon={<Plus size={20} />} onClick={() => setEditing({ key: `new-${Date.now()}` })}>
            Log a call
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPill icon={<Users size={22} />} value={people.length} label="Calls with people" tone="good" />
        <StatPill icon={<Clock size={22} />} value={`${peopleMin} min`} label="Talking with people" tone="rouge" />
        <StatPill icon={<Smile size={22} />} value={avgConf} label="Average confidence" tone="gold" />
        <StatPill icon={<Bot size={22} />} value={rows.length - people.length} label="AI and self-talk" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          {sorted.length === 0 ? (
            <Card>
              <p className="py-6 text-center font-semibold text-muted">No conversations yet. After your next tutor or exchange call, log it here.</p>
            </Card>
          ) : (
            sorted.map((c) => (
              <button
                key={c.id}
                onClick={() => setEditing({ key: c.id, id: c.id })}
                className={cx('flex w-full items-start gap-3 rounded-3xl border-2 bg-surface p-4 text-left', editing?.id === c.id ? 'border-accent' : 'border-line')}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-good-soft text-good">
                  {c.kind.startsWith('ai') ? <Bot size={20} /> : <Phone size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold tracking-wider text-muted uppercase">
                    {format(fromDayKey(c.day), 'EEE d MMM')} · {KIND[c.kind]} · {c.durationMin} min
                  </span>
                  <span className="block font-black">{c.partner ?? KIND[c.kind]}</span>
                  {c.topics && <span className="block text-sm font-semibold text-muted">{c.topics}</span>}
                  <span className="mt-1 block text-xs font-bold text-muted">
                    {c.newWords.length} new word{c.newWords.length === 1 ? '' : 's'}
                    {c.confidence ? ` · confidence ${c.confidence}/5` : ''}
                    {c.turns ? ` · ${c.turns} turns` : ''}
                  </span>
                </span>
              </button>
            ))
          )}
        </section>
        <section>
          {editing && (
            <ConversationForm
              key={editing.key}
              existing={editing.id ? rows.find((r) => r.id === editing.id) : undefined}
              onSaved={(c) => setEditing({ key: editing.key, id: c.id })}
            />
          )}
        </section>
      </div>
    </div>
  )
}
