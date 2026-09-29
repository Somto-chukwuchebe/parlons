import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { useApp } from '../app/AppContext'
import { Button, Card, Notice, PageHeader, TL } from '../components/ui'
import { db, updateSettings, type SeedOverrideRow } from '../db/schema'
import { contentWeek, fromDayKey } from '../lib/program'
import { withOverride } from '../lib/seed'
import { speak } from '../lib/tts'
import type { PhraseSeed, WeekSeed } from '../packs/types'

export function Course() {
  const { pack, lang, profile, plan, today, settings } = useApp()
  const navigate = useNavigate()
  const overrideRows = useLiveQuery(() => db.seedOverrides.where('lang').equals(lang).toArray(), [lang], [])
  const overrides = useMemo(() => new Map(overrideRows.map((o) => [o.id, o])), [overrideRows])
  const current = plan ? contentWeek(plan, today) : 1
  const [open, setOpen] = useState<number | null>(current)
  const showEn = settings.showEnglish

  async function approve() {
    if (!profile) return
    await db.profiles.update(lang, { seedApprovedAt: Date.now() })
    navigate('/')
  }

  return (
    <div>
      <PageHeader
        title="Course"
        action={
          <Button variant="ghost" onClick={() => updateSettings({ showEnglish: !showEn })} aria-pressed={showEn}>
            {showEn ? 'Hide English' : 'Show English'}
          </Button>
        }
      />

      {!profile?.seedApprovedAt && (
        <Card className="mb-4 space-y-3 border-accent">
          <h2 className="font-semibold">Review the course before you start</h2>
          <p className="text-sm text-muted">
            This is everything the app will teach over 12 weeks. Skim it; look closely at weeks 1–2. Tap{' '}
            <strong>Edit</strong> on any phrase to fix it, or hide it. Phrases marked ⚑ are ones I'd like you to
            double-check. You can keep editing after approving.
          </p>
          <Button size="lg" className="w-full" onClick={approve}>
            Approve and start using it
          </Button>
        </Card>
      )}

      <ol className="space-y-3">
        {pack.weeks.map((w) => {
          const span = plan?.weeks.find((s) => s.week === w.week)
          return (
            <li key={w.week}>
              <Card className={w.week === current ? 'border-accent' : ''}>
                <button
                  className="flex w-full items-start gap-3 text-left"
                  aria-expanded={open === w.week}
                  onClick={() => setOpen(open === w.week ? null : w.week)}
                >
                  <span className="mt-0.5 rounded-lg bg-accent-soft px-2 py-1 text-sm font-semibold text-accent">
                    W{w.week}
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{w.theme}</span>
                    <span className="block text-sm text-muted">{w.grammar}</span>
                    {span && (
                      <span className="block text-xs text-muted">
                        {format(fromDayKey(span.start), 'd MMM')} – {format(fromDayKey(span.end), 'd MMM')}
                        {w.week === current ? ' · this week' : ''}
                      </span>
                    )}
                  </span>
                  <span aria-hidden className="text-muted">
                    {open === w.week ? '−' : '+'}
                  </span>
                </button>
                {open === w.week && <WeekDetail week={w} overrides={overrides} showEn={showEn} />}
              </Card>
            </li>
          )
        })}
      </ol>

      <Card className="mt-3">
        <h2 className="mb-2 font-semibold">Repair phrases (from week 1)</h2>
        <PhraseList items={pack.repairPhrases} overrides={overrides} showEn={showEn} />
      </Card>

      <Card className="mt-3 space-y-3">
        <h2 className="font-semibold">Personal script (weeks 1–2)</h2>
        {pack.personalScript.map((s) => (
          <div key={s.id}>
            <p className="font-medium">
              Week {s.week}: {s.title}
            </p>
            <p className="text-sm text-muted">{s.guide}</p>
            <p className="text-sm">
              Example: <TL>{s.example}</TL>
            </p>
          </div>
        ))}
      </Card>

      <Card className="mt-3 space-y-3">
        <h2 className="font-semibold">Pronunciation drills</h2>
        {pack.drills.map((d) => (
          <div key={d.id}>
            <p className="font-medium">{d.title}</p>
            <p className="text-sm text-muted">{d.explain}</p>
            <p className="text-sm">
              {d.items.map((i, n) => (
                <span key={n}>
                  <TL>{i.b ? `${i.a} / ${i.b}` : i.a}</TL>
                  {n < d.items.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </p>
          </div>
        ))}
      </Card>

      <Card className="mt-3">
        <h2 className="mb-2 font-semibold">Role-play scenarios</h2>
        <ul className="list-disc pl-5 text-sm">
          {pack.scenarios.map((s) => (
            <li key={s.id}>
              <strong>{s.title}</strong> — {s.setup}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function WeekDetail({ week, overrides, showEn }: { week: WeekSeed; overrides: Map<string, SeedOverrideRow>; showEn: boolean }) {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">The pattern</h3>
        <p className="whitespace-pre-line text-sm">{week.lesson}</p>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Model sentences</h3>
        <ul className="space-y-1">
          {week.models.map((m, i) => (
            <li key={i}>
              <TL>{m.target}</TL>
              {showEn && <span className="block text-sm text-muted">{m.en}</span>}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">I can…</h3>
        <ul className="list-disc pl-5 text-sm">
          {week.canDo.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">
          Phrases ({week.phrases.length})
        </h3>
        <PhraseList items={week.phrases} overrides={overrides} showEn={showEn} />
      </div>
      <div>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Speaking prompts</h3>
        <ul className="space-y-2">
          {week.prompts.map((p) => (
            <li key={p.id}>
              <TL>{p.target}</TL>
              {showEn && <span className="block text-sm text-muted">{p.en}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function PhraseList({ items, overrides, showEn }: { items: PhraseSeed[]; overrides: Map<string, SeedOverrideRow>; showEn: boolean }) {
  const { pack, lang, profile } = useApp()
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <ul className="divide-y divide-line">
      {items.map((seed) => {
        const override = overrides.get(seed.id)
        const p = withOverride(seed, overrides)
        if (editing === seed.id) {
          return (
            <li key={seed.id} className="py-2">
              <EditPhrase
                seed={seed}
                current={p ?? seed}
                onDone={() => setEditing(null)}
                onSave={async (patch) => {
                  await db.seedOverrides.put({ id: seed.id, lang, ...override, ...patch })
                  setEditing(null)
                }}
              />
            </li>
          )
        }
        return (
          <li key={seed.id} className={`flex items-start gap-2 py-2 ${p ? '' : 'opacity-50'}`}>
            <button
              className="mt-0.5 rounded-lg p-1 text-accent"
              aria-label="Listen"
              onClick={() => speak((p ?? seed).target, { locale: pack.speech.locale, voiceURI: profile?.voiceURI, rate: profile?.ttsRate })}
            >
              ▶
            </button>
            <div className="flex-1">
              {pack.reviewFlags[seed.id] && (
                <span className="mb-1 block rounded-lg bg-warn-bg px-2 py-1 text-xs text-warn-ink">⚑ {pack.reviewFlags[seed.id]}</span>
              )}
              <TL className={p ? '' : 'line-through'}>{(p ?? seed).target}</TL>
              {showEn && <span className="block text-sm text-muted">{(p ?? seed).en}</span>}
              {(p ?? seed).note && <span className="block text-xs text-muted">Note: {(p ?? seed).note}</span>}
              {override && !override.hidden && <span className="text-xs text-accent">Edited</span>}
            </div>
            <button className="rounded-lg px-2 py-1 text-sm text-accent" onClick={() => setEditing(seed.id)}>
              Edit
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function EditPhrase({
  seed,
  current,
  onSave,
  onDone,
}: {
  seed: PhraseSeed
  current: PhraseSeed
  onSave: (patch: Partial<SeedOverrideRow>) => void
  onDone: () => void
}) {
  const [target, setTarget] = useState(current.target)
  const [en, setEn] = useState(current.en)
  const [note, setNote] = useState(current.note ?? '')
  const input = 'min-h-11 w-full rounded-lg border border-line bg-bg px-3'
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ target, en, note: note || undefined, hidden: false })
      }}
    >
      <label className="block text-sm">
        French
        <input className={input} value={target} onChange={(e) => setTarget(e.target.value)} required />
      </label>
      <label className="block text-sm">
        English
        <input className={input} value={en} onChange={(e) => setEn(e.target.value)} required />
      </label>
      <label className="block text-sm">
        Note
        <input className={input} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <p className="text-xs text-muted">Original: {seed.target}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Save</Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="ghost" onClick={() => onSave({ target: undefined, en: undefined, note: undefined, hidden: false })}>
          Restore original
        </Button>
        <Button variant="danger" onClick={() => onSave({ hidden: true })}>
          Hide
        </Button>
      </div>
      <Notice>Edits apply to the phrase card from now on.</Notice>
    </form>
  )
}

