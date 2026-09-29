import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronRight, Dices, Phone, Volume2 } from 'lucide-react'
import { useApp } from '../../app/AppContext'
import { db, newId, type RecordingRow } from '../../db/schema'
import { speak } from '../../lib/tts'
import { shadowClips } from '../../lib/audio'
import { ShadowPlayer, sourceId, type ShadowSource } from '../ShadowPlayer'
import type { PromptSeed, WeekSeed } from '../../packs/types'
import { Recorder } from '../Recorder'
import { Button, Card, cx, Eyebrow, Notice, Segmented, TextArea, TextInput, TL } from '../ui'

// Content for each stage of the guided session. Each reports what happened upwards
// so the end-of-session summary can say exactly what you did.

/** Deterministic daily pick, so the same day shows the same prompts. */
function pickForDay<T>(items: T[], day: string, n: number): T[] {
  if (!items.length) return []
  const seed = [...day].reduce((a, c) => a + c.charCodeAt(0), 0)
  const start = seed % items.length
  return Array.from({ length: Math.min(n, items.length) }, (_, i) => items[(start + i * 3) % items.length])
}

function useSpeaker() {
  const { pack, profile } = useApp()
  return (text: string, rate?: number) =>
    speak(text, { locale: pack.speech.locale, voiceURI: profile?.voiceURI, rate: rate ?? profile?.ttsRate })
}

// Structure --------------------------------------------------------------------

export function StructureStage({ week, lessonLog, onLessonLog }: { week: WeekSeed; lessonLog: string; onLessonLog: (v: string) => void }) {
  const { settings } = useApp()
  const say = useSpeaker()
  const [said, setSaid] = useState<Set<number>>(new Set())
  return (
    <div className="space-y-5">
      <Card>
        <Eyebrow className="text-accent">This week's pattern</Eyebrow>
        <h3 className="mt-1 text-xl font-black">{week.grammar}</h3>
        <details className="mt-3" open>
          <summary className="cursor-pointer text-sm font-extrabold text-accent">Explanation</summary>
          <p className="mt-2 whitespace-pre-line leading-relaxed">{week.lesson}</p>
        </details>
      </Card>
      <Card>
        <Eyebrow className="mb-3">Model sentences: listen, then say each one aloud twice</Eyebrow>
        <ul className="space-y-2">
          {week.models.map((m, i) => (
            <li key={i}>
              <button
                onClick={() => {
                  void say(m.target)
                  setSaid((s) => new Set(s).add(i))
                }}
                className={cx('flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors', said.has(i) ? 'bg-good-soft' : 'bg-sunk hover:bg-accent-soft')}
              >
                <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', said.has(i) ? 'bg-good text-white' : 'bg-accent text-on-accent')}>
                  <Volume2 size={20} />
                </span>
                <span className="min-w-0">
                  <TL className="block text-lg font-bold">{m.target}</TL>
                  {settings.showEnglish && <span className="block text-sm font-semibold text-muted">{m.en}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <TextInput
          label="Did an outside lesson today? (optional)"
          placeholder="e.g. Language Transfer track 12"
          value={lessonLog}
          onChange={(e) => onLessonLog(e.target.value)}
          hint="Logged with today's session."
        />
      </Card>
    </div>
  )
}

// Shadowing --------------------------------------------------------------------

export function ShadowingStage({ week, onRep }: { week: WeekSeed; onRep: () => void }) {
  const { pack } = useApp()
  // Native clips first; the device voice reads the model sentences as extra material.
  const sources: ShadowSource[] = useMemo(
    () => [
      ...shadowClips(pack, week.week).map((clip) => ({ kind: 'native' as const, clip })),
      ...week.models.map((m, i) => ({ kind: 'tts' as const, id: `w${week.week}-m${i}`, text: m.target, en: m.en })),
    ],
    [pack, week],
  )
  const [i, setI] = useState(0)
  const source = sources[i]
  const drill = pack.drills[(week.week - 1) % pack.drills.length]
  const go = (d: number) => setI((n) => (n + d + sources.length) % sources.length)

  return (
    <div className="space-y-5">
      <ShadowPlayer
        key={sourceId(source)}
        source={source}
        onRep={onRep}
        header={
          <div className="flex items-center justify-between gap-2">
            <Button size="sm" icon={<ChevronLeft size={20} />} onClick={() => go(-1)} aria-label="Previous sentence" />
            <Eyebrow>
              {i + 1} of {sources.length}
            </Eyebrow>
            <Button size="sm" icon={<ChevronRight size={20} />} onClick={() => go(1)} aria-label="Next sentence" />
          </div>
        }
      />
      <Notice>
        <strong>How to shadow:</strong> speak along with the voice, a split second behind it, copying the rhythm and melody
        rather than individual words. Then record yourself and play both.
      </Notice>
      <Card>
        <p className="font-black">This week's sound: {drill.title}</p>
        <p className="text-sm font-semibold text-muted">{drill.explain}</p>
        <Link to="/shadowing" className="mt-2 inline-block text-sm font-extrabold text-accent underline">
          Practise it in Pronunciation drills
        </Link>
      </Card>
    </div>
  )
}

// Speak --------------------------------------------------------------------------

export function SpeakStage({ week, count, onRecorded }: { week: WeekSeed; count: number; onRecorded: (r: RecordingRow) => void }) {
  const { today } = useApp()
  const prompts = useMemo(() => pickForDay(week.prompts, today, count), [week, today, count])
  return (
    <div className="space-y-5">
      {prompts.map((p, n) => (
        <PromptCard key={p.id} prompt={p} n={n + 1} kind="speak" onRecorded={onRecorded} />
      ))}
    </div>
  )
}

function PromptCard({ prompt, n, kind, maxSec, onRecorded, extra }: { prompt: PromptSeed; n?: number; kind: 'speak' | 'selftalk'; maxSec?: number; onRecorded: (r: RecordingRow) => void; extra?: ReactNode }) {
  const { settings } = useApp()
  const say = useSpeaker()
  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        {n && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rouge-soft font-black text-rouge">{n}</span>}
        <div className="min-w-0 flex-1">
          <button onClick={() => say(prompt.target)} className="text-left">
            <TL className="text-xl font-black leading-snug">{prompt.target}</TL>
          </button>
          {settings.showEnglish && <p className="mt-1 font-semibold text-muted">{prompt.en}</p>}
          {prompt.hints && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {prompt.hints.map((h) => (
                <li key={h} className="rounded-xl bg-sunk px-3 py-1 text-sm font-bold">
                  <TL>{h}</TL>
                </li>
              ))}
            </ul>
          )}
        </div>
        {extra}
      </div>
      <Recorder kind={kind} promptId={prompt.id} promptText={prompt.target} maxSec={maxSec} onSaved={onRecorded} />
    </Card>
  )
}

// Conversation -------------------------------------------------------------------

export function ConversationStage({ onCallLogged, onRecorded }: { onCallLogged: (minutes: number) => void; onRecorded: (r: RecordingRow) => void }) {
  const [tab, setTab] = useState<'call' | 'self'>('call')
  return (
    <div className="space-y-5">
      <Segmented
        label="Conversation type"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'call', label: 'I had a call' },
          { value: 'self', label: 'Self-talk' },
        ]}
      />
      {tab === 'call' ? <CallForm onLogged={onCallLogged} /> : <SelfTalk onRecorded={onRecorded} />}
    </div>
  )
}

function CallForm({ onLogged }: { onLogged: (minutes: number) => void }) {
  const { lang, today } = useApp()
  const [kind, setKind] = useState<'tutor' | 'exchange'>('tutor')
  const [partner, setPartner] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [topics, setTopics] = useState('')
  const [notes, setNotes] = useState('')
  const [confidence, setConfidence] = useState(3)
  const [saved, setSaved] = useState(false)

  async function save() {
    await db.conversations.add({
      id: newId(),
      lang,
      day: today,
      kind,
      partner: partner || undefined,
      durationMin: minutes,
      topics: topics || undefined,
      notes: notes || undefined,
      confidence,
      newWords: [],
      createdAt: Date.now(),
    })
    setSaved(true)
    onLogged(minutes)
  }

  if (saved)
    return (
      <Notice tone="good">
        Call logged: {minutes} minutes of real conversation. New words and mistakes from calls get their own log in a
        later update.
      </Notice>
    )

  return (
    <Card className="space-y-4">
      <p className="font-semibold text-muted">A real call with a tutor or language partner replaces this stage.</p>
      <Segmented
        label="Who with"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'tutor', label: 'Tutor' },
          { value: 'exchange', label: 'Language exchange' },
        ]}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Partner (optional)" value={partner} onChange={(e) => setPartner(e.target.value)} />
        <TextInput label="Minutes" type="number" min={1} max={300} value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 0)} />
      </div>
      <TextInput label="Topics" placeholder="e.g. my weekend, work, films" value={topics} onChange={(e) => setTopics(e.target.value)} />
      <TextArea label="Notes (optional)" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div>
        <p className="mb-2 text-sm font-extrabold">How confident did you feel?</p>
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Confidence">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={confidence === n}
              onClick={() => setConfidence(n)}
              className={cx('min-h-12 rounded-2xl text-lg font-black', confidence === n ? 'bg-accent text-on-accent' : 'bg-sunk text-muted')}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <Button variant="primary" size="lg" className="w-full" icon={<Phone size={20} />} onClick={save} disabled={minutes <= 0}>
        Log the call
      </Button>
    </Card>
  )
}

export function SelfTalk({ onRecorded }: { onRecorded: (r: RecordingRow) => void }) {
  const { pack } = useApp()
  const [i, setI] = useState(() => Math.floor(Math.random() * pack.selfTalkPrompts.length))
  const prompt = pack.selfTalkPrompts[i]
  return (
    <PromptCard
      key={prompt.id}
      prompt={prompt}
      kind="selftalk"
      maxSec={60}
      onRecorded={onRecorded}
      extra={
        <Button size="sm" icon={<Dices size={18} />} onClick={() => setI((n) => (n + 1 + Math.floor(Math.random() * (pack.selfTalkPrompts.length - 1))) % pack.selfTalkPrompts.length)} aria-label="Another prompt" />
      }
    />
  )
}
