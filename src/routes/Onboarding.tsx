import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router'
import { format } from 'date-fns'
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Flag, Mic, Sparkles, Volume2 } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, cx, Eyebrow, Notice, Select, TextInput, TL } from '../components/ui'
import { Logo } from '../components/Logo'
import { APP_NAME, DEFAULT_START_DATE, PROGRAM_DAYS } from '../config'
import { db, DEFAULT_SETTINGS, type Profile } from '../db/schema'
import { CEFR_SPEAKING, estimateLevel } from '../lib/cefr'
import { buildPlan, fromDayKey } from '../lib/program'
import { requestPersistence, storageErrorMessage } from '../lib/storage'
import { speak, ttsSupported, voicesFor } from '../lib/tts'

const STEPS = [
  { title: 'Welcome', icon: Sparkles },
  { title: 'Your dates', icon: CalendarDays },
  { title: 'Daily time', icon: Clock },
  { title: 'Voice', icon: Volume2 },
  { title: 'Starting point', icon: Flag },
] as const

export function Onboarding() {
  const { pack, lang, today, profile } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [startDate, setStartDate] = useState(profile?.startDate ?? (today > DEFAULT_START_DATE ? today : DEFAULT_START_DATE))
  const [dailyMinutes, setDailyMinutes] = useState<30 | 45 | 60>(profile?.dailyMinutes ?? 30)
  const [studyTime, setStudyTime] = useState(profile?.studyTime ?? '07:30')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState<string | undefined>(profile?.voiceURI)
  const [ttsRate, setTtsRate] = useState(profile?.ttsRate ?? 0.9)
  const [checked, setChecked] = useState<string[]>(profile?.startingCanDo ?? [])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    voicesFor(pack.speech.locale, pack.speech.preferredVoices).then((v) => {
      setVoices(v)
      setVoiceURI((cur) => cur ?? v[0]?.voiceURI)
    })
  }, [pack])

  const plan = buildPlan(startDate)
  const w1 = plan.weeks[0]
  const nice = (k: string) => format(fromDayKey(k), 'EEE d MMM')
  const sample = pack.weeks[0].phrases[0].target
  const last = step === STEPS.length - 1

  async function finish() {
    try {
      const p: Profile = {
        lang,
        startDate,
        dailyMinutes,
        studyTime,
        voiceURI,
        ttsRate,
        startingCanDo: checked,
        startingLevel: estimateLevel(checked),
        seedApprovedAt: profile?.seedApprovedAt,
        onboardedAt: profile?.onboardedAt ?? Date.now(),
      }
      await db.profiles.put(p)
      const persisted = await requestPersistence()
      const settings = (await db.settings.get('app')) ?? { ...DEFAULT_SETTINGS, activeLang: lang }
      await db.settings.put({ ...settings, storagePersisted: persisted })
      navigate(p.seedApprovedAt ? '/' : '/course', { replace: true })
    } catch (e) {
      setError(storageErrorMessage(e))
    }
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
      {/* Brand panel (desktop) */}
      <aside className="safe-top relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-white/5" aria-hidden />
        <div className="pointer-events-none absolute top-1/3 -left-16 h-48 w-48 rounded-full bg-rouge/20" aria-hidden />
        <div className="flex items-center gap-3">
          <Logo size={48} />
          <span className="text-3xl font-black tracking-tight">{APP_NAME}</span>
        </div>
        <p className="mt-12 text-4xl font-black leading-tight">
          Speak {pack.name}
          <br />
          out loud, every day.
        </p>
        <p className="mt-4 text-lg font-semibold text-white/75">{PROGRAM_DAYS} days. 12 stations. Real conversations by the end.</p>
        <ol className="relative mt-12 space-y-5">
          <span className="absolute top-3 bottom-3 left-[15px] w-1.5 rounded-full bg-white/15" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex items-center gap-4">
              <span
                className={cx(
                  'grid h-9 w-9 place-items-center rounded-full font-black',
                  i < step ? 'bg-white text-navy' : i === step ? 'bg-rouge text-white ring-4 ring-rouge/30' : 'bg-white/15 text-white/60',
                )}
              >
                {i < step ? <Check size={18} strokeWidth={3.5} /> : i + 1}
              </span>
              <span className={cx('text-lg font-extrabold', i > step && 'text-white/60')}>{s.title}</span>
            </li>
          ))}
        </ol>
      </aside>

      <div className="safe-top safe-x safe-bottom flex min-h-dvh flex-col">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-6 sm:py-10 lg:justify-center">
          {/* Phone header + progress */}
          <div className="flex items-center gap-3 lg:hidden">
            <Logo size={36} />
            <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Setup progress">
              {STEPS.map((s, i) => (
                <span key={s.title} className={cx('h-2.5 flex-1 rounded-full', i <= step ? 'bg-accent' : 'bg-line')} />
              ))}
            </div>
          </div>

          <div key={step} className="space-y-6">
            {step === 0 && (
              <>
                <div className="pop-in grid h-20 w-20 place-items-center rounded-3xl bg-rouge-soft text-rouge">
                  <Mic size={40} strokeWidth={2.4} />
                </div>
                <div>
                  <h1 className="text-4xl font-black leading-tight">Welcome to {APP_NAME}!</h1>
                  <p className="mt-3 text-lg font-semibold text-muted">
                    Every day you'll speak {pack.name} out loud: say phrases before you see them, shadow real sentences, answer
                    questions on the record, and watch your progress honestly.
                  </p>
                </div>
                <ul className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    ['2 min', 'to set up'],
                    ['100%', 'offline'],
                    ['0', 'accounts needed'],
                  ].map(([big, small]) => (
                    <li key={small} className="rounded-2xl bg-surface p-4 ring-2 ring-line">
                      <p className="text-2xl font-black text-accent">{big}</p>
                      <p className="text-sm font-bold text-muted">{small}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {step === 1 && (
              <>
                <StepHeading eyebrow="Step 1 of 4" title="When do you start?" />
                <TextInput label="Start date" type="date" value={startDate} onChange={(e) => e.target.value && setStartDate(e.target.value)} />
                <div className="overflow-hidden rounded-3xl bg-surface ring-2 ring-line">
                  <PlanRow label={`${PROGRAM_DAYS}-day programme`} value={`${nice(plan.start)} → ${nice(plan.end)}`} />
                  <PlanRow
                    label="Week 1"
                    value={`${nice(w1.start)} → ${nice(w1.end)}`}
                    note={w1.days > 7 ? `A long first week (${w1.days} days)` : w1.days < 7 ? `A short first week (${w1.days} days)` : '7 days'}
                  />
                  <PlanRow label="Weeks 2–12" value="Monday → Sunday" note="Weekly review every Sunday" />
                  <PlanRow label="Final stretch" value={`${nice(plan.finalStretch.start)} → ${nice(plan.finalStretch.end)}`} note={`${plan.finalStretch.days} days of catch-up and conversation`} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <StepHeading eyebrow="Step 2 of 4" title="How long each day?" note="Your usual session. You can pick another length any day, including a 10-minute version on busy days." />
                <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Daily target">
                  {([30, 45, 60] as const).map((m) => (
                    <button
                      key={m}
                      role="radio"
                      aria-checked={dailyMinutes === m}
                      onClick={() => setDailyMinutes(m)}
                      className={cx(
                        'press rounded-3xl border-2 p-4 text-center',
                        dailyMinutes === m ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface',
                      )}
                      style={{ '--lip': dailyMinutes === m ? 'var(--accent)' : 'var(--line)' } as CSSProperties}
                    >
                      <span className="block text-4xl font-black">{m}</span>
                      <span className="block text-sm font-extrabold">minutes</span>
                    </button>
                  ))}
                </div>
                <TextInput label="Preferred study time" type="time" value={studyTime} onChange={(e) => setStudyTime(e.target.value)} hint="Used for the calendar reminder you can add later." />
              </>
            )}

            {step === 3 && (
              <>
                <StepHeading eyebrow="Step 3 of 4" title={`Choose a ${pack.name} voice`} note="Used to read phrases aloud. Your own recordings and real audio clips come later." />
                {!ttsSupported() || voices.length === 0 ? (
                  <Notice tone="warn">
                    No {pack.name} voice was found on this device. The app still works with your recordings and imported audio. On
                    iPhone and Mac, add one in Settings → Accessibility → Spoken Content → Voices → {pack.name}.
                  </Notice>
                ) : (
                  <Select label="Voice" value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang}){v.localService ? '' : ' · online'}
                      </option>
                    ))}
                  </Select>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-extrabold">
                    <label htmlFor="rate">Speed</label>
                    <span className="text-accent">{ttsRate.toFixed(2)}×</span>
                  </div>
                  <input id="rate" type="range" min={0.7} max={1.2} step={0.05} value={ttsRate} onChange={(e) => setTtsRate(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
                </div>
                <button
                  disabled={!voices.length}
                  onClick={() => speak(sample, { locale: pack.speech.locale, voiceURI, rate: ttsRate })}
                  className="press flex w-full items-center gap-4 rounded-3xl border-2 border-line bg-surface p-4 text-left disabled:opacity-45"
                  style={{ '--lip': 'var(--line)' } as CSSProperties}
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent">
                    <Volume2 size={24} />
                  </span>
                  <span>
                    <Eyebrow>Tap to hear</Eyebrow>
                    <TL className="text-lg font-bold">{sample}</TL>
                  </span>
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <StepHeading eyebrow="Step 4 of 4" title="Where are you starting from?" note={`Tick what you can already do when speaking ${pack.name}. Be honest; it only sets your starting point.`} />
                <ul className="space-y-2">
                  {CEFR_SPEAKING.map((s) => {
                    const on = checked.includes(s.id)
                    return (
                      <li key={s.id}>
                        <button
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => setChecked((c) => (on ? c.filter((x) => x !== s.id) : [...c, s.id]))}
                          className={cx(
                            'flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 p-3 text-left font-semibold transition-colors',
                            on ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent/50',
                          )}
                        >
                          <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2', on ? 'border-accent bg-accent text-on-accent' : 'border-line')}>
                            {on && <Check size={16} strokeWidth={3.5} />}
                          </span>
                          <span className="flex-1">{s.text}</span>
                          <span className="rounded-lg bg-sunk px-2 py-0.5 text-xs font-black text-muted">{s.level}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <Notice icon={<Flag size={20} />}>
                  Estimated starting level: <strong>{levelLabel(estimateLevel(checked))}</strong>
                </Notice>
              </>
            )}
          </div>

          {error && <Notice tone="danger">{error}</Notice>}

          <div className="sticky bottom-0 mt-auto flex gap-3 bg-bg pt-2 pb-4 lg:static lg:bg-transparent">
            {step > 0 && (
              <Button size="lg" icon={<ArrowLeft size={20} />} onClick={() => setStep(step - 1)} aria-label="Back" />
            )}
            <Button variant={last ? 'good' : 'primary'} size="lg" className="flex-1" onClick={last ? finish : () => setStep(step + 1)}>
              {last ? "Let's go!" : step === 0 ? 'Get started' : 'Continue'}
              {!last && <ArrowRight size={20} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <div>
      <Eyebrow className="text-accent">{eyebrow}</Eyebrow>
      <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
      {note && <p className="mt-2 font-semibold text-muted">{note}</p>}
    </div>
  )
}

function PlanRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b-2 border-line px-5 py-4 last:border-b-0">
      <span className="font-extrabold">{label}</span>
      <span className="text-right">
        <span className="block font-bold">{value}</span>
        {note && <span className="block text-sm font-semibold text-muted">{note}</span>}
      </span>
    </div>
  )
}

function levelLabel(l: string) {
  return l === 'A0' ? 'beginner (below A1)' : l
}
