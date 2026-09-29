import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { CheckCircle2, Eye, Lightbulb, Mic, Volume2 } from 'lucide-react'
import { useApp } from '../app/AppContext'
import type { CardRow } from '../db/schema'
import { parseCloze } from '../packs/helpers'
import { buildQueue, gradeCard, intervalLabel, type GradeName } from '../lib/srs'
import { speak } from '../lib/tts'
import { Button, cx, Eyebrow, TL } from './ui'

// Speak-first review: prompt → say it out loud → reveal (auto-plays audio) → grade.
// Keyboard: Space/Enter reveals, 1–4 grade.

export interface ReviewResult {
  reviewed: number
  again: number
}

const GRADE_STYLES: Record<GradeName, { label: string; cls: string; lip: string }> = {
  again: { label: 'Again', cls: 'bg-again text-white dark:text-[#2a1003]', lip: 'color-mix(in oklab, var(--again) 60%, black)' },
  hard: { label: 'Hard', cls: 'bg-hard text-white dark:text-[#2a1d03]', lip: 'color-mix(in oklab, var(--hard) 60%, black)' },
  good: { label: 'Good', cls: 'bg-good text-white dark:text-[#06240f]', lip: 'color-mix(in oklab, var(--good) 60%, black)' },
  easy: { label: 'Easy', cls: 'bg-accent text-on-accent', lip: 'color-mix(in oklab, var(--accent) 60%, black)' },
}

export function ReviewDeck({ cap, onProgress }: { cap: number; onProgress?: (r: ReviewResult) => void }) {
  const { lang, pack, profile, settings } = useApp()
  const [queue, setQueue] = useState<CardRow[] | null>(null)
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [result, setResult] = useState<ReviewResult>({ reviewed: 0, again: 0 })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    buildQueue(lang, cap).then(setQueue)
  }, [lang, cap])

  const card = queue?.[i]
  const say = useCallback(
    (text: string) => speak(text, { locale: pack.speech.locale, voiceURI: profile?.voiceURI, rate: profile?.ttsRate }),
    [pack, profile],
  )
  const fullText = card ? card.target.replace(/\[\[(.+?)\]\]/g, '$1') : ''

  const reveal = useCallback(() => {
    if (!card || revealed) return
    setRevealed(true)
    void say(fullText)
  }, [card, revealed, say, fullText])

  const grade = useCallback(
    async (g: GradeName) => {
      if (!card || !revealed || busy) return
      setBusy(true)
      const updated = await gradeCard(card, g)
      const r = { reviewed: result.reviewed + 1, again: result.again + (g === 'again' ? 1 : 0) }
      setResult(r)
      onProgress?.(r)
      // "Again" cards come back once more at the end of this session.
      if (g === 'again' && queue) setQueue([...queue, updated])
      setRevealed(false)
      setI((n) => n + 1)
      setBusy(false)
    },
    [card, revealed, busy, result, onProgress, queue],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        reveal()
      } else if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
        void grade((['again', 'hard', 'good', 'easy'] as const)[Number(e.key) - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed, reveal, grade])

  if (!queue) return <p className="py-10 text-center font-bold text-muted">Shuffling your cards…</p>

  if (!card) {
    return (
      <div className="pop-in flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 size={56} className="text-good" />
        <p className="text-2xl font-black">{result.reviewed ? 'Review done!' : 'Nothing due right now'}</p>
        <p className="font-semibold text-muted">
          {result.reviewed
            ? `${result.reviewed} card${result.reviewed === 1 ? '' : 's'} said out loud. The rest are scheduled for later.`
            : 'Your cards are all scheduled for later. Move on to the next stage.'}
        </p>
      </div>
    )
  }

  const cloze = card.kind === 'cloze' ? parseCloze(card.target) : null
  const eyebrow = card.kind === 'error' ? 'Fix it: say the correct version' : cloze ? 'Fill the gap: say the whole sentence' : `Say it in ${pack.name}`
  const isNew = card.fsrs.reps === 0

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunk" aria-hidden>
          <div className="h-full rounded-full bg-good transition-all" style={{ width: `${(i / queue.length) * 100}%` }} />
        </div>
        <span className="text-sm font-extrabold text-muted">
          {i + 1} / {queue.length}
        </span>
      </div>

      <div key={card.id + i} className="pop-in rounded-3xl border-2 border-line bg-surface p-6 text-center sm:p-8">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Eyebrow>{eyebrow}</Eyebrow>
          {isNew && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-black text-gold-ink">New</span>}
        </div>

        {card.kind === 'phrase' && <p className="text-2xl font-black leading-snug sm:text-3xl">{card.en}</p>}
        {cloze && (
          <>
            <p className="text-2xl font-black leading-snug sm:text-3xl">
              <TL>{cloze.prompt}</TL>
            </p>
            {settings.showEnglish && <p className="mt-2 font-semibold text-muted">{card.en}</p>}
          </>
        )}
        {card.kind === 'error' && (
          <>
            <p className="text-2xl font-black leading-snug text-again line-through decoration-2 sm:text-3xl">
              <TL>{card.wrong ?? ''}</TL>
            </p>
            {settings.showEnglish && <p className="mt-2 font-semibold text-muted">{card.en}</p>}
          </>
        )}

        {!revealed ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="flex items-center gap-2 font-extrabold text-rouge">
              <Mic size={20} /> Say it out loud first
            </p>
            <Button variant="primary" size="xl" className="w-full max-w-sm" icon={<Eye size={22} />} onClick={reveal}>
              Show answer
            </Button>
            <p className="hidden text-xs font-bold text-muted sm:block">Space to reveal</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3 border-t-2 border-dashed border-line pt-6">
            <button onClick={() => say(fullText)} className="group inline-flex items-center gap-3 text-left" aria-label="Play again">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent">
                <Volume2 size={24} />
              </span>
              <TL className="text-2xl font-black text-accent sm:text-3xl">{fullText}</TL>
            </button>
            {card.kind !== 'phrase' && !settings.showEnglish && <p className="font-semibold text-muted">{card.en}</p>}
            {card.note && (
              <p className="mx-auto flex max-w-md items-start justify-center gap-1.5 text-sm font-semibold text-muted">
                <Lightbulb size={16} className="mt-0.5 shrink-0" /> {card.note}
              </p>
            )}
          </div>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="How well did you say it?">
          {(Object.keys(GRADE_STYLES) as GradeName[]).map((g, n) => (
            <button
              key={g}
              disabled={busy}
              onClick={() => grade(g)}
              className={cx('press flex min-h-16 flex-col items-center justify-center rounded-2xl px-1 font-black', GRADE_STYLES[g].cls)}
              style={{ '--lip': GRADE_STYLES[g].lip } as CSSProperties}
            >
              <span>{GRADE_STYLES[g].label}</span>
              <span className="text-xs font-bold opacity-85">
                {intervalLabel(card, g)}
                <span className="hidden sm:inline"> · {n + 1}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
