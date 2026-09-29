import { useRef, useState } from 'react'
import { AudioLines, Square } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { diffWords, listen, recognitionSupported, wordsPerMinute, type DiffToken, type Listening } from '../lib/speech'
import { Button, cx, Notice } from './ui'

// "What did the device hear?" Approximate by design: recognisers guess, and they're
// trained on fluent speakers. Useful as a nudge, never as a grade.

export function PronunciationCheck({ target, onResult }: { target: string; onResult?: (r: { transcript: string; wpm: number | null; score: number }) => void }) {
  const { pack, lang } = useApp()
  const [state, setState] = useState<'idle' | 'listening' | 'done'>('idle')
  const [tokens, setTokens] = useState<DiffToken[] | null>(null)
  const [heard, setHeard] = useState('')
  const [score, setScore] = useState(0)
  const [wpm, setWpm] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const active = useRef<Listening | null>(null)

  if (!recognitionSupported()) return null

  async function start() {
    setError(null)
    setTokens(null)
    setState('listening')
    const l = listen(pack.speech.locale)
    active.current = l
    const r = await l.result
    active.current = null
    if (!r.ok) {
      setError(r.reason)
      setState('idle')
      return
    }
    const d = diffWords(target, r.transcript)
    const w = wordsPerMinute(r.transcript, r.seconds)
    setTokens(d.tokens)
    setHeard(r.transcript)
    setScore(d.score)
    setWpm(w)
    setState('done')
    onResult?.({ transcript: r.transcript, wpm: w, score: d.score })
  }

  return (
    <div className="space-y-3">
      {state === 'listening' ? (
        <Button variant="rouge" className="w-full" icon={<Square size={18} fill="currentColor" />} onClick={() => active.current?.stop()}>
          Listening… tap when you've finished
        </Button>
      ) : (
        <Button className="w-full" icon={<AudioLines size={20} />} onClick={start}>
          {state === 'done' ? 'Check again' : 'Check my pronunciation'}
        </Button>
      )}

      {tokens && (
        <div className="rounded-2xl bg-sunk p-4">
          <p className="mb-2 text-xs font-extrabold tracking-wider text-muted uppercase">What your device heard (approximate)</p>
          <p className="text-lg leading-relaxed" lang={lang}>
            {tokens.map((t, i) => (
              <span
                key={i}
                className={cx(
                  'mr-1.5 inline-block rounded-md px-1 font-bold',
                  t.status === 'match' && 'bg-good-soft text-good',
                  t.status === 'missed' && 'bg-again/15 text-again underline decoration-wavy',
                  t.status === 'extra' && 'text-muted line-through',
                )}
                title={t.status === 'missed' ? 'Expected, not heard' : t.status === 'extra' ? 'Heard, not expected' : 'Heard'}
              >
                {t.word}
              </span>
            ))}
          </p>
          <p className="mt-2 text-sm font-semibold text-muted">
            {Math.round(score * 100)}% of the words recognised
            {wpm ? ` · about ${wpm} words per minute` : ''}. Heard: “{heard}”
          </p>
          <p className="mt-1 text-xs font-semibold text-muted">
            Green = heard. Orange = expected but not heard (worth another try). Struck through = heard something else.
          </p>
        </div>
      )}
      {error && <Notice tone="warn">{error}</Notice>}
    </div>
  )
}
