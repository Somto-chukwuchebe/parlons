import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Flag, PenLine } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { db, newId, type RecordingRow } from '../db/schema'
import { addCard } from '../lib/srs'
import { wordsPerMinute } from '../lib/speech'
import { storageErrorMessage } from '../lib/storage'
import { Button, cx, Eyebrow, Notice, Select, TextArea, TextInput, TL } from './ui'

// After a recording: listen back, rate yourself honestly, note what you said,
// and turn mistakes into "fix it" cards.

type RatingKey = 'fluency' | 'accuracy' | 'pronunciation'
const RATINGS: { key: RatingKey; label: string; hint: string }[] = [
  { key: 'fluency', label: 'Fluency', hint: 'Did it flow, or lots of pauses?' },
  { key: 'accuracy', label: 'Accuracy', hint: 'Grammar and word choice' },
  { key: 'pronunciation', label: 'Pronunciation', hint: 'How French did it sound?' },
]

export function RatingRow({ label, hint, value, onChange }: { label: string; hint?: string; value?: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-sm font-extrabold">{label}</p>
        {hint && <p className="text-xs font-semibold text-muted">{hint}</p>}
      </div>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} of 5`}
            onClick={() => onChange(n)}
            className={cx(
              'h-10 w-10 rounded-xl text-sm font-black transition-colors',
              value && n <= value ? 'bg-gold text-[#3d2a00]' : 'bg-surface text-muted ring-2 ring-line',
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

export function RecordingReview({ recording, compact = false }: { recording: RecordingRow; compact?: boolean }) {
  const { pack, lang, today } = useApp()
  const [ratings, setRatings] = useState(recording.ratings ?? {})
  const [transcript, setTranscript] = useState(recording.transcript ?? '')
  const [showText, setShowText] = useState(!!recording.transcript)
  const [tagging, setTagging] = useState(false)
  const mistakes = useLiveQuery(
    () => db.mistakes.where('[lang+day]').equals([lang, recording.day]).filter((m) => m.sourceId === recording.id).toArray(),
    [lang, recording.id, recording.day],
    [],
  )

  async function rate(key: RatingKey, n: number) {
    const next = { ...ratings, [key]: n }
    setRatings(next)
    await db.recordings.update(recording.id, { ratings: next })
  }

  async function saveTranscript() {
    const wpm = wordsPerMinute(transcript, recording.durationSec) ?? undefined
    await db.recordings.update(recording.id, { transcript: transcript || undefined, wpm })
  }

  const wpm = transcript ? wordsPerMinute(transcript, recording.durationSec) : null

  return (
    <div className="space-y-4 rounded-2xl bg-sunk p-4">
      <Eyebrow>Rate yourself</Eyebrow>
      <div className="space-y-3">
        {(compact ? RATINGS.filter((r) => r.key === 'pronunciation') : RATINGS).map((r) => (
          <RatingRow key={r.key} label={compact ? 'How close did you sound?' : r.label} hint={compact ? undefined : r.hint} value={ratings[r.key]} onChange={(n) => rate(r.key, n)} />
        ))}
      </div>

      {!compact && (
        <>
          {showText ? (
            <div className="space-y-2">
              <TextArea
                label="What you said (optional)"
                hint={wpm ? `About ${wpm} words per minute.` : 'Type roughly what you said; the app works out your words per minute.'}
                rows={3}
                lang={lang}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onBlur={saveTranscript}
              />
            </div>
          ) : (
            <Button size="sm" variant="ghost" icon={<PenLine size={16} />} onClick={() => setShowText(true)}>
              Write down what you said
            </Button>
          )}

          {mistakes.length > 0 && (
            <ul className="space-y-2">
              {mistakes.map((m) => (
                <li key={m.id} className="rounded-xl bg-surface p-3 text-sm">
                  <span className="text-again line-through">
                    <TL>{m.wrong}</TL>
                  </span>{' '}
                  →{' '}
                  <span className="font-bold text-good">
                    <TL>{m.correct}</TL>
                  </span>
                  <span className="block text-xs font-bold text-muted">{pack.mistakeCategories.find((c) => c.id === m.category)?.label}</span>
                </li>
              ))}
            </ul>
          )}

          {tagging ? (
            <MistakeForm recordingId={recording.id} day={today} onDone={() => setTagging(false)} />
          ) : (
            <Button size="sm" icon={<Flag size={16} />} onClick={() => setTagging(true)}>
              Tag a mistake
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export function MistakeForm({
  recordingId,
  day,
  source = 'recording',
  onDone,
}: {
  recordingId?: string
  day: string
  source?: 'recording' | 'conversation' | 'manual'
  onDone: () => void
}) {
  const { pack, lang } = useApp()
  const [category, setCategory] = useState(pack.mistakeCategories[0]?.id ?? '')
  const [wrong, setWrong] = useState('')
  const [correct, setCorrect] = useState('')
  const [explanation, setExplanation] = useState('')
  const [makeCard, setMakeCard] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save() {
    try {
      let cardId: string | undefined
      if (makeCard) {
        const card = await addCard({ lang, kind: 'error', wrong, target: correct, en: explanation || 'Say the correct version.', source: 'mistake' })
        cardId = card.id
      }
      await db.mistakes.add({
        id: newId(),
        lang,
        day,
        category,
        wrong: wrong.trim(),
        correct: correct.trim(),
        explanation: explanation.trim() || undefined,
        source,
        sourceId: recordingId,
        cardId,
        createdAt: Date.now(),
      })
      setSaved(true)
      setTimeout(onDone, 900)
    } catch (e) {
      setError(storageErrorMessage(e))
    }
  }

  if (saved)
    return (
      <Notice tone="good" icon={<Check size={18} />}>
        Saved{makeCard ? ', and added as a "fix it" card' : ''}.
      </Notice>
    )

  return (
    <div className="space-y-3 rounded-2xl bg-surface p-4 ring-2 ring-line">
      <Select label="Type of mistake" value={category} onChange={(e) => setCategory(e.target.value)}>
        {pack.mistakeCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label} ({c.hint})
          </option>
        ))}
      </Select>
      <TextInput label="What I said" lang={lang} value={wrong} onChange={(e) => setWrong(e.target.value)} placeholder="e.g. Je suis allé au le cinéma" />
      <TextInput label="Correct version" lang={lang} value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="e.g. Je suis allé au cinéma" />
      <TextInput label="Why (optional)" value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="e.g. à + le = au" />
      <label className="flex items-center gap-3 text-sm font-bold">
        <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={makeCard} onChange={(e) => setMakeCard(e.target.checked)} />
        Practise it: add a "fix it" card (you'll see what you said and say the correct version)
      </label>
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex gap-2">
        <Button variant="primary" onClick={save} disabled={!wrong.trim() || !correct.trim()}>
          Save mistake
        </Button>
        <Button onClick={onDone}>Cancel</Button>
      </div>
    </div>
  )
}
