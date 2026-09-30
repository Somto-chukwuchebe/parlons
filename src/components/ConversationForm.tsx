import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Flag, Phone, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { db, newId, type ConversationRow } from '../db/schema'
import { addCard } from '../lib/srs'
import { storageErrorMessage } from '../lib/storage'
import { MistakeForm, RatingRow } from './RecordingReview'
import { Button, Card, cx, Eyebrow, Notice, Segmented, TextArea, TextInput, TL } from './ui'

// Log a tutor or language-exchange call: what you talked about, new words (one tap to
// make them phrase cards), mistakes you made, and how confident you felt.

export function ConversationForm({ existing, onSaved, compact = false }: { existing?: ConversationRow; onSaved?: (c: ConversationRow) => void; compact?: boolean }) {
  const { lang, today } = useApp()
  const [row, setRow] = useState<ConversationRow>(
    existing ?? {
      id: newId(),
      lang,
      day: today,
      kind: 'tutor',
      durationMin: 30,
      newWords: [],
      confidence: 3,
      createdAt: Date.now(),
    },
  )
  const [saved, setSaved] = useState(!!existing)
  const [error, setError] = useState<string | null>(null)
  const [word, setWord] = useState({ target: '', en: '' })
  const [tagging, setTagging] = useState(false)
  const mistakes = useLiveQuery(() => db.mistakes.where('[lang+day]').equals([lang, row.day]).filter((m) => m.sourceId === row.id).toArray(), [lang, row.day, row.id], [])

  const set = (patch: Partial<ConversationRow>) => setRow((r) => ({ ...r, ...patch }))

  async function save(next = row) {
    try {
      await db.conversations.put(next)
      setSaved(true)
      onSaved?.(next)
    } catch (e) {
      setError(storageErrorMessage(e))
    }
  }

  async function addWord() {
    if (!word.target.trim()) return
    const next = { ...row, newWords: [...row.newWords, { target: word.target.trim(), en: word.en.trim() }] }
    setRow(next)
    setWord({ target: '', en: '' })
    if (saved) await db.conversations.put(next)
  }

  async function wordToCard(i: number, base = row) {
    const w = base.newWords[i]
    const card = await addCard({ lang, target: w.target, en: w.en || '(from a conversation)', note: row.partner ? `From a call with ${row.partner}` : 'From a conversation', source: 'conversation' })
    const next = { ...base, newWords: base.newWords.map((x, j) => (j === i ? { ...x, cardId: card.id } : x)) }
    setRow(next)
    await db.conversations.put(next)
    onSaved?.(next)
  }

  return (
    <Card className="space-y-5">
      {!compact && <Eyebrow>{existing ? 'Edit call' : 'New call'}</Eyebrow>}
      <Segmented
        label="Who with"
        value={row.kind === 'exchange' ? 'exchange' : 'tutor'}
        onChange={(kind) => set({ kind })}
        options={[
          { value: 'tutor', label: 'Tutor' },
          { value: 'exchange', label: 'Language exchange' },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput label="Date" type="date" value={row.day} max={today} onChange={(e) => e.target.value && set({ day: e.target.value })} />
        <TextInput label="Partner" value={row.partner ?? ''} onChange={(e) => set({ partner: e.target.value || undefined })} placeholder="optional" />
        <TextInput label="Minutes" type="number" inputMode="numeric" min={1} max={600} value={row.durationMin || ''} onChange={(e) => set({ durationMin: Number(e.target.value) || 0 })} />
      </div>
      <TextInput label="Topics" placeholder="e.g. my weekend, work, a film" value={row.topics ?? ''} onChange={(e) => set({ topics: e.target.value || undefined })} />
      <RatingRow label="How confident did you feel?" hint="1 = struggled a lot · 5 = felt at ease" value={row.confidence} onChange={(confidence) => set({ confidence })} />
      <TextArea label="Notes (optional)" rows={2} value={row.notes ?? ''} onChange={(e) => set({ notes: e.target.value || undefined })} />

      <div className="space-y-3">
        <Eyebrow>New words and phrases</Eyebrow>
        {row.newWords.length > 0 && (
          <ul className="space-y-2">
            {row.newWords.map((w, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-sunk p-3">
                <div className="min-w-0 flex-1">
                  <TL className="font-bold">{w.target}</TL>
                  {w.en && <span className="block text-sm font-semibold text-muted">{w.en}</span>}
                </div>
                {w.cardId ? (
                  <span className="flex items-center gap-1 text-sm font-extrabold text-good">
                    <Check size={16} /> In phrases
                  </span>
                ) : (
                  <Button size="sm" variant="primary" icon={<Plus size={16} />} onClick={() => (saved ? wordToCard(i) : save().then(() => wordToCard(i, row)))}>
                    Add to phrases
                  </Button>
                )}
                {!w.cardId && (
                  <button
                    className="rounded-lg p-2 text-muted"
                    aria-label="Remove word"
                    onClick={() => {
                      const next = { ...row, newWords: row.newWords.filter((_, j) => j !== i) }
                      setRow(next)
                      if (saved) void db.conversations.put(next)
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <TextInput label="Word or phrase" lang={lang} value={word.target} onChange={(e) => setWord({ ...word, target: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addWord()} />
          <TextInput label="Meaning" value={word.en} onChange={(e) => setWord({ ...word, en: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addWord()} />
          <Button onClick={addWord} disabled={!word.target.trim()} icon={<Plus size={18} />}>
            Add
          </Button>
        </div>
      </div>

      {saved && (
        <div className="space-y-3">
          <Eyebrow>Mistakes I made</Eyebrow>
          {mistakes.map((m) => (
            <p key={m.id} className="rounded-xl bg-sunk p-3 text-sm">
              <span className="text-again line-through">
                <TL>{m.wrong}</TL>
              </span>{' '}
              → <TL className="font-bold text-good">{m.correct}</TL>
            </p>
          ))}
          {tagging ? (
            <MistakeForm recordingId={row.id} day={row.day} source="conversation" onDone={() => setTagging(false)} />
          ) : (
            <Button size="sm" icon={<Flag size={16} />} onClick={() => setTagging(true)}>
              Add a mistake
            </Button>
          )}
        </div>
      )}

      {error && <Notice tone="danger">{error}</Notice>}
      <Button variant={saved ? 'secondary' : 'primary'} size="lg" className={cx('w-full')} icon={<Phone size={20} />} onClick={() => save()} disabled={row.durationMin <= 0}>
        {saved ? 'Save changes' : 'Log the call'}
      </Button>
      {saved && !existing && <Notice tone="good">Logged: {row.durationMin} minutes of real conversation. Add words and mistakes above while they're fresh.</Notice>}
    </Card>
  )
}
