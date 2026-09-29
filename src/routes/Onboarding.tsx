import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { format } from 'date-fns'
import { useApp } from '../app/AppContext'
import { Button, Card, Notice, Segmented, TL } from '../components/ui'
import { APP_NAME, DEFAULT_START_DATE } from '../config'
import { db, DEFAULT_SETTINGS, type Profile } from '../db/schema'
import { CEFR_SPEAKING, estimateLevel } from '../lib/cefr'
import { buildPlan, fromDayKey } from '../lib/program'
import { requestPersistence, storageErrorMessage } from '../lib/storage'
import { speak, ttsSupported, voicesFor } from '../lib/tts'

const STEPS = ['Welcome', 'Dates', 'Daily time', 'Voice', 'Starting point'] as const

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
  const nice = (k: string) => format(fromDayKey(k), 'EEE d MMM yyyy')

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
    <div className="pt-safe px-safe pb-safe mx-auto flex min-h-dvh max-w-xl flex-col gap-4 py-6">
      <ol className="flex gap-1" aria-label="Setup progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-accent' : 'bg-line'}`}>
            <span className="sr-only">
              {s} {i < step ? '(done)' : i === step ? '(current)' : ''}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <img src="icons/logo.svg" alt="" className="h-20 w-20" />
          <h1 className="text-3xl font-semibold">Welcome to {APP_NAME}.</h1>
          <p className="text-muted">
            {APP_NAME} gets you speaking {pack.name} out loud every day: review phrases by saying them, shadow real
            sentences, record yourself answering questions, and see honestly whether you're improving.
          </p>
          <p className="text-muted">Setup takes about two minutes. Everything stays on this device.</p>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="text-2xl font-semibold">When do you start?</h1>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => e.target.value && setStartDate(e.target.value)}
              className="min-h-12 rounded-xl border border-line bg-surface px-3"
            />
          </label>
          <Card className="space-y-2 text-sm">
            <p>
              <strong>90-day programme:</strong> {nice(plan.start)} → {nice(plan.end)}
            </p>
            <p>
              <strong>Week 1:</strong> {nice(w1.start)} → {nice(w1.end)} ({w1.days} days
              {w1.days > 7 ? ', a long first week' : w1.days < 7 ? ', a short first week' : ''})
            </p>
            <p>
              <strong>Weeks 2–12</strong> run Monday to Sunday. Your weekly review is every Sunday.
            </p>
            <p>
              <strong>Final stretch:</strong> {nice(plan.finalStretch.start)} → {nice(plan.finalStretch.end)} (
              {plan.finalStretch.days} days of catch-up and conversation practice).
            </p>
          </Card>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-2xl font-semibold">How long each day?</h1>
          <p className="text-muted">
            Your usual session length. You can pick a different one each day, including a 10-minute version on busy
            days.
          </p>
          <Segmented
            label="Daily target"
            value={dailyMinutes}
            onChange={setDailyMinutes}
            options={[
              { value: 30, label: '30 min' },
              { value: 45, label: '45 min' },
              { value: 60, label: '60 min' },
            ]}
          />
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Preferred study time</span>
            <input
              type="time"
              value={studyTime}
              onChange={(e) => setStudyTime(e.target.value)}
              className="min-h-12 rounded-xl border border-line bg-surface px-3"
            />
            <span className="text-xs text-muted">Used for the calendar reminder you can add later.</span>
          </label>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="text-2xl font-semibold">Choose a {pack.name} voice</h1>
          {!ttsSupported() || voices.length === 0 ? (
            <Notice tone="warn">
              No {pack.name} voice was found on this device. The app still works; you'll use your own recordings and
              imported audio instead. On iPhone and Mac, you can add voices in Settings → Accessibility → Spoken
              Content → Voices → {pack.name}.
            </Notice>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Voice</span>
              <select
                value={voiceURI}
                onChange={(e) => setVoiceURI(e.target.value)}
                className="min-h-12 rounded-xl border border-line bg-surface px-3"
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang}){v.localService ? '' : ' · online'}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Speed: {ttsRate.toFixed(2)}×</span>
            <input
              type="range"
              min={0.7}
              max={1.2}
              step={0.05}
              value={ttsRate}
              onChange={(e) => setTtsRate(Number(e.target.value))}
            />
          </label>
          <Button
            variant="secondary"
            disabled={!voices.length}
            onClick={() =>
              speak(pack.weeks[0].phrases[0].target, { locale: pack.speech.locale, voiceURI, rate: ttsRate })
            }
          >
            ▶ Play a sample
          </Button>
          <p className="text-sm text-muted">
            Sample: <TL>{pack.weeks[0].phrases[0].target}</TL>
          </p>
        </>
      )}

      {step === 4 && (
        <>
          <h1 className="text-2xl font-semibold">Where are you starting from?</h1>
          <p className="text-muted">
            Tick what you can already do when speaking {pack.name}. Be honest, it only sets your starting point.
          </p>
          <ul className="space-y-2">
            {CEFR_SPEAKING.map((s) => (
              <li key={s.id}>
                <label className="flex min-h-12 items-start gap-3 rounded-xl border border-line bg-surface p-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 accent-[var(--accent)]"
                    checked={checked.includes(s.id)}
                    onChange={(e) =>
                      setChecked((c) => (e.target.checked ? [...c, s.id] : c.filter((x) => x !== s.id)))
                    }
                  />
                  <span>
                    <span className="mr-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs font-semibold">{s.level}</span>
                    {s.text}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <Notice>
            Estimated starting level: <strong>{levelLabel(estimateLevel(checked))}</strong>
          </Notice>
        </>
      )}

      {error && <Notice tone="danger">{error}</Notice>}

      <div className="mt-auto flex gap-3 pt-4">
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button className="flex-1" size="lg" onClick={() => setStep(step + 1)}>
            Continue
          </Button>
        ) : (
          <Button className="flex-1" size="lg" onClick={finish}>
            Finish setup
          </Button>
        )}
      </div>
    </div>
  )
}

function levelLabel(l: string) {
  return l === 'A0' ? 'beginner (below A1)' : l
}
