import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { format } from 'date-fns'
import { BookOpen, Lightbulb, Eye, EyeOff, Flag, LifeBuoy, MessagesSquare, PenLine, Volume2, Waves } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, Eyebrow, Notice, PageHeader, TextInput, TL } from '../components/ui'
import { MetroLineVertical } from '../components/MetroLine'
import { db, type SeedOverrideRow } from '../db/schema'
import { contentWeek, fromDayKey, phaseOn } from '../lib/program'
import { withOverride } from '../lib/seed'
import { speak } from '../lib/tts'
import type { PhraseSeed, WeekSeed } from '../packs/types'

type Panel = number | 'repair' | 'script' | 'drills' | 'scenarios'

const EXTRAS: { id: Panel; label: string; icon: typeof LifeBuoy }[] = [
  { id: 'repair', label: 'Repair phrases', icon: LifeBuoy },
  { id: 'script', label: 'Personal script', icon: PenLine },
  { id: 'drills', label: 'Pronunciation', icon: Waves },
  { id: 'scenarios', label: 'Role-plays', icon: MessagesSquare },
]

export function Course() {
  const { pack, lang, profile, plan, today, settings } = useApp()
  const navigate = useNavigate()
  const overrideRows = useLiveQuery(() => db.seedOverrides.where('lang').equals(lang).toArray(), [lang], [])
  const overrides = useMemo(() => new Map(overrideRows.map((o) => [o.id, o])), [overrideRows])
  const phase = plan ? phaseOn(plan, today) : undefined
  const current = !plan || phase?.kind === 'before' ? 0 : phase?.kind === 'final' || phase?.kind === 'after' ? 13 : contentWeek(plan, today)
  const [panel, setPanel] = useState<Panel>(Math.max(1, Math.min(12, current)))
  const detailRef = useRef<HTMLDivElement>(null)
  const [showEn, setShowEn] = useState(settings.showEnglish)

  function select(p: Panel) {
    setPanel(p)
    // On phones the detail sits below the line: bring it into view.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  async function approve() {
    await db.profiles.update(lang, { seedApprovedAt: Date.now() })
    navigate('/')
  }

  const stations = pack.weeks.map((w) => {
    const span = plan?.weeks.find((s) => s.week === w.week)
    return {
      week: w.week,
      title: w.theme,
      subtitle: span ? `${format(fromDayKey(span.start), 'd MMM')} – ${format(fromDayKey(span.end), 'd MMM')}` : undefined,
    }
  })

  return (
    <div>
      <PageHeader
        back="/more"
        title="Your course"
        subtitle={`12 stations to confident conversation in ${pack.name}`}
        actions={
          <Button variant="secondary" size="sm" icon={showEn ? <EyeOff size={18} /> : <Eye size={18} />} onClick={() => setShowEn(!showEn)} aria-pressed={showEn}>
            {showEn ? 'Hide English' : 'Show English'}
          </Button>
        }
      />

      {!profile?.seedApprovedAt && (
        <Card className="mb-6 border-accent bg-accent-soft">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="text-lg font-black">Review your course before you start</h2>
              <p className="mt-1 text-sm font-semibold text-muted">
                Skim it, and look closely at weeks 1–2. Tap Edit on any phrase to fix or hide it. Items marked ⚑ are worth a
                second look. You can keep editing after approving.
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={approve}>
              Approve course
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Card className="p-3">
            <MetroLineVertical stations={stations} current={current} selected={typeof panel === 'number' ? panel : null} onSelect={select} terminus="Final stretch & fluency check" />
          </Card>
          <Card className="p-3">
            <Eyebrow className="px-2 pt-1 pb-2">Always available</Eyebrow>
            <ul className="grid grid-cols-2 gap-2">
              {EXTRAS.map(({ id, label, icon: Icon }) => (
                <li key={String(id)}>
                  <button
                    onClick={() => select(id)}
                    aria-pressed={panel === id}
                    className={cx(
                      'flex min-h-12 w-full items-center gap-2 rounded-2xl px-3 text-left text-sm font-extrabold transition-colors',
                      panel === id ? 'bg-accent-soft text-accent' : 'bg-sunk hover:text-accent',
                    )}
                  >
                    <Icon size={18} strokeWidth={2.5} />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div ref={detailRef} className="scroll-mt-4 min-w-0">
          {typeof panel === 'number' && <WeekDetail week={pack.weeks[panel - 1]} overrides={overrides} showEn={showEn} isCurrent={panel === current} />}
          {panel === 'repair' && (
            <Card>
              <PanelTitle icon={<LifeBuoy />} eyebrow="From week 1" title="Repair phrases" note="Your lifelines when you're stuck. Learn these early." />
              <PhraseList items={pack.repairPhrases} overrides={overrides} showEn={showEn} />
            </Card>
          )}
          {panel === 'script' && (
            <Card className="space-y-4">
              <PanelTitle icon={<PenLine />} eyebrow="Weeks 1–2" title="Personal script" note="Short texts about you. You'll write and record them; each sentence becomes a phrase card." />
              {pack.personalScript.map((s) => (
                <div key={s.id} className="rounded-2xl bg-sunk p-4">
                  <Eyebrow>Week {s.week}</Eyebrow>
                  <p className="text-lg font-black">{s.title}</p>
                  <p className="text-sm font-semibold text-muted">{s.guide}</p>
                  <p className="mt-2 text-[17px]">
                    <TL>{s.example}</TL>
                  </p>
                </div>
              ))}
            </Card>
          )}
          {panel === 'drills' && (
            <Card className="space-y-4">
              <PanelTitle icon={<Waves />} eyebrow="Shadowing stage" title="Pronunciation drills" />
              {pack.drills.map((d) => (
                <div key={d.id} className="rounded-2xl bg-sunk p-4">
                  <p className="text-lg font-black">{d.title}</p>
                  <p className="text-sm font-semibold text-muted">{d.explain}</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {d.items.map((i, n) => (
                      <li key={n}>
                        <SpeakChip text={i.b ? `${i.a}… ${i.b}` : i.a} label={i.b ? `${i.a} / ${i.b}` : i.a} title={i.en} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          )}
          {panel === 'scenarios' && (
            <Card className="space-y-3">
              <PanelTitle icon={<MessagesSquare />} eyebrow="AI role-play" title="Scenarios" />
              {pack.scenarios.map((s) => (
                <div key={s.id} className="rounded-2xl bg-sunk p-4">
                  <p className="font-black">{s.title}</p>
                  <p className="text-sm font-semibold text-muted">{s.setup}</p>
                  <p className="mt-1 text-xs font-bold text-muted">The AI plays {s.role}.</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function PanelTitle({ icon, eyebrow, title, note }: { icon: ReactNode; eyebrow: string; title: string; note?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">{icon}</span>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-2xl font-black leading-tight">{title}</h2>
        {note && <p className="mt-1 text-sm font-semibold text-muted">{note}</p>}
      </div>
    </div>
  )
}

function SpeakChip({ text, label, title }: { text: string; label: string; title?: string }) {
  const { pack, profile } = useApp()
  return (
    <button
      onClick={() => speak(text, { locale: pack.speech.locale, voiceURI: profile?.voiceURI, rate: profile?.ttsRate })}
      title={title}
      className="press inline-flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-line bg-surface px-3 text-[15px] font-bold"
      style={{ '--lip': 'var(--line)' } as CSSProperties}
    >
      <Volume2 size={16} className="text-accent" />
      <TL>{label}</TL>
    </button>
  )
}

function WeekDetail({ week, overrides, showEn, isCurrent }: { week: WeekSeed; overrides: Map<string, SeedOverrideRow>; showEn: boolean; isCurrent: boolean }) {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute -right-10 -bottom-20 h-56 w-56 rounded-full bg-white/5" aria-hidden />
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-white/70">
          Station {week.week}
          {isCurrent && <span className="ml-2 rounded-full bg-rouge px-2 py-0.5 text-white">You are here</span>}
        </p>
        <h2 className="mt-1 text-3xl font-black leading-tight">{week.theme}</h2>
        <p className="mt-1 font-semibold text-white/80">{week.grammar}</p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {week.canDo.map((c) => (
            <li key={c} className="flex items-start gap-2 rounded-2xl bg-white/10 p-3 text-sm font-bold">
              <Flag size={16} className="mt-0.5 shrink-0 text-gold" />
              {c}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <PanelTitle icon={<BookOpen />} eyebrow="Structure stage" title="The pattern" />
        <p className="whitespace-pre-line leading-relaxed">{week.lesson}</p>
        <Eyebrow className="mt-6 mb-2">Model sentences</Eyebrow>
        <ul className="grid gap-2">
          {week.models.map((m, i) => (
            <li key={i} className="rounded-2xl bg-sunk px-4 py-3">
              <TL className="text-[17px] font-bold">{m.target}</TL>
              {showEn && <span className="block text-sm font-semibold text-muted">{m.en}</span>}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-xl font-black">Phrases</h3>
          <span className="text-sm font-bold text-muted">{week.phrases.length}</span>
        </div>
        <PhraseList items={week.phrases} overrides={overrides} showEn={showEn} />
      </Card>

      <Card>
        <h3 className="mb-3 text-xl font-black">Speaking prompts</h3>
        <ol className="space-y-3">
          {week.prompts.map((p, i) => (
            <li key={p.id} className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rouge-soft text-sm font-black text-rouge">{i + 1}</span>
              <div>
                <TL className="text-[17px] font-bold">{p.target}</TL>
                {showEn && <span className="block text-sm font-semibold text-muted">{p.en}</span>}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

function PhraseList({ items, overrides, showEn }: { items: PhraseSeed[]; overrides: Map<string, SeedOverrideRow>; showEn: boolean }) {
  const { pack, lang, profile } = useApp()
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <ul className="divide-y-2 divide-line">
      {items.map((seed) => {
        const override = overrides.get(seed.id)
        const p = withOverride(seed, overrides)
        const shown = p ?? seed
        if (editing === seed.id) {
          return (
            <li key={seed.id} className="py-3">
              <EditPhrase
                seed={seed}
                current={shown}
                onDone={() => setEditing(null)}
                onSave={async (patch) => {
                  await db.seedOverrides.put({ id: seed.id, lang, ...override, ...patch })
                  setEditing(null)
                }}
              />
            </li>
          )
        }
        const flag = pack.reviewFlags[seed.id]
        return (
          <li key={seed.id} className={cx('flex items-start gap-3 py-3', !p && 'opacity-50')}>
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent hover:brightness-95"
              aria-label="Listen"
              onClick={() => speak(shown.target, { locale: pack.speech.locale, voiceURI: profile?.voiceURI, rate: profile?.ttsRate })}
            >
              <Volume2 size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <TL className={cx('text-[17px] font-bold', !p && 'line-through')}>{shown.target}</TL>
              {showEn && <span className="block text-sm font-semibold text-muted">{shown.en}</span>}
              {shown.note && <span className="mt-0.5 flex items-start gap-1 text-xs font-semibold text-muted"><Lightbulb size={14} className="mt-px shrink-0" /> {shown.note}</span>}
              {flag && <span className="mt-2 block rounded-xl bg-warn-bg px-3 py-2 text-xs font-bold text-warn-ink">⚑ {flag}</span>}
              {override && !override.hidden && <span className="mt-1 inline-block rounded-full bg-good-soft px-2 text-xs font-extrabold text-good">Edited</span>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(seed.id)}>
              Edit
            </Button>
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
  const { pack } = useApp()
  const [target, setTarget] = useState(current.target)
  const [en, setEn] = useState(current.en)
  const [note, setNote] = useState(current.note ?? '')
  return (
    <form
      className="space-y-3 rounded-2xl bg-sunk p-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSave({ target, en, note: note || undefined, hidden: false })
      }}
    >
      <TextInput label={pack.name} value={target} onChange={(e) => setTarget(e.target.value)} required />
      <TextInput label="English" value={en} onChange={(e) => setEn(e.target.value)} required />
      <TextInput label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      <p className="text-xs font-semibold text-muted">Original: {seed.target}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary">
          Save
        </Button>
        <Button onClick={onDone}>Cancel</Button>
        <Button variant="ghost" onClick={() => onSave({ target: undefined, en: undefined, note: undefined, hidden: false })}>
          Restore original
        </Button>
        <Button variant="danger" onClick={() => onSave({ hidden: true })}>
          Hide
        </Button>
      </div>
      <Notice>Edits apply to this phrase's card from now on.</Notice>
    </form>
  )
}
