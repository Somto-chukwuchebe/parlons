import { useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { FileAudio, Trash2, Upload, Volume2, Waves } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Button, Card, cx, Eyebrow, Notice, PageHeader, Segmented, TextArea, TextInput, TL } from '../components/ui'
import { ShadowPlayer, sourceId, sourceText, type ShadowSource } from '../components/ShadowPlayer'
import { PronunciationCheck } from '../components/PronunciationCheck'
import { db, newId, type ClipRow } from '../db/schema'
import { shadowClips } from '../lib/audio'
import { contentWeek } from '../lib/program'
import { storageErrorMessage } from '../lib/storage'
import { speak } from '../lib/tts'

const MAX_IMPORT_BYTES = 60 * 1024 * 1024

export function Shadowing() {
  const { pack, lang, plan, today } = useApp()
  const [week, setWeek] = useState(plan ? contentWeek(plan, today) : 1)
  const [tab, setTab] = useState<'clips' | 'drills'>('clips')
  const imported = useLiveQuery(() => db.clips.where('[lang+week]').equals([lang, week]).toArray(), [lang, week], [])
  const w = pack.weeks[week - 1]

  const sources: ShadowSource[] = useMemo(
    () => [
      ...shadowClips(pack, week).map((clip) => ({ kind: 'native' as const, clip })),
      ...imported.map((clip) => ({ kind: 'import' as const, clip })),
      ...w.models.map((m, i) => ({ kind: 'tts' as const, id: `w${week}-m${i}`, text: m.target, en: m.en })),
    ],
    [pack, week, imported, w],
  )
  const [selected, setSelected] = useState<string | null>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const current = sources.find((s) => sourceId(s) === selected) ?? sources[0]

  return (
    <div>
      <PageHeader back="/speak" title="Shadowing" subtitle="Speak along with native speakers, copying their rhythm and melody." />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Week">
        {pack.weeks.map((x) => (
          <button
            key={x.week}
            role="radio"
            aria-checked={week === x.week}
            onClick={() => {
              setWeek(x.week)
              setSelected(null)
            }}
            className={cx('min-h-10 shrink-0 rounded-xl px-3 text-sm font-extrabold', week === x.week ? 'bg-accent text-on-accent' : 'bg-surface text-muted ring-2 ring-line')}
          >
            W{x.week}
          </button>
        ))}
      </div>

      <div className="mb-5 max-w-sm">
        <Segmented
          label="Section"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'clips', label: 'Clips' },
            { value: 'drills', label: 'Pronunciation drills' },
          ]}
        />
      </div>

      {tab === 'clips' ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div className="order-2 space-y-4 lg:order-1">
            <Card className="p-3">
              <Eyebrow className="px-2 pt-1 pb-2">{w.theme}</Eyebrow>
              <ul className="space-y-1">
                {sources.map((s) => {
                  const id = sourceId(s)
                  const on = current && sourceId(current) === id
                  return (
                    <li key={id}>
                      <button
                        onClick={() => {
                          setSelected(id)
                          if (window.matchMedia('(max-width: 1023px)').matches) playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                        className={cx('flex w-full items-start gap-3 rounded-2xl p-2.5 text-left', on ? 'bg-accent-soft' : 'hover:bg-sunk')}
                        aria-pressed={on}
                      >
                        <span
                          className={cx(
                            'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                            s.kind === 'native' ? 'bg-good-soft text-good' : s.kind === 'import' ? 'bg-gold-soft text-gold-ink' : 'bg-sunk text-muted',
                          )}
                          aria-hidden
                        >
                          {s.kind === 'native' ? <Waves size={16} /> : s.kind === 'import' ? <FileAudio size={16} /> : <Volume2 size={16} />}
                        </span>
                        <span className="min-w-0 text-sm">
                          <span className="block font-bold">{s.kind === 'import' ? s.clip.title : <TL>{sourceText(s)}</TL>}</span>
                          <span className="block text-xs font-semibold text-muted">
                            {s.kind === 'native' ? `Native · ${s.clip.speaker}` : s.kind === 'import' ? 'Your audio' : 'Device voice'}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Card>
            <ImportClip week={week} onImported={(id) => setSelected(`clip:${id}`)} />
          </div>
          <div ref={playerRef} className="order-1 min-w-0 scroll-mt-4 space-y-4 lg:order-2">
            {current && <ShadowPlayer key={sourceId(current)} source={current} />}
            {current?.kind === 'import' && <EditClip clip={current.clip} onDeleted={() => setSelected(null)} />}
          </div>
        </div>
      ) : (
        <Drills />
      )}
    </div>
  )
}

function ImportClip({ week, onImported }: { week: number; onImported: (id: string) => void }) {
  const { lang } = useApp()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function onFile(file: File) {
    setError(null)
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|aac|wav|ogg|opus|webm)$/i.test(file.name)) return setError('That doesn’t look like an audio file.')
    if (file.size > MAX_IMPORT_BYTES) return setError('That file is over 60 MB. Trim it to the part you want to shadow first.')
    try {
      const id = newId()
      const row: ClipRow = {
        id,
        lang,
        week,
        title: file.name.replace(/\.[^.]+$/, ''),
        source: 'import',
        blob: file,
        mimeType: file.type || 'audio/mpeg',
        createdAt: Date.now(),
      }
      await db.clips.add(row)
      onImported(id)
    } catch (e) {
      setError(storageErrorMessage(e))
    } finally {
      if (input.current) input.current.value = ''
    }
  }

  return (
    <Card className="space-y-3">
      <p className="font-black">Your own audio</p>
      <p className="text-sm font-semibold text-muted">Import a podcast or lesson clip you've downloaded. It stays on this device and goes into backups.</p>
      <input ref={input} type="file" accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <Button className="w-full" icon={<Upload size={18} />} onClick={() => input.current?.click()}>
        Import audio for week {week}
      </Button>
      {error && <Notice tone="danger">{error}</Notice>}
    </Card>
  )
}

function EditClip({ clip, onDeleted }: { clip: ClipRow; onDeleted: () => void }) {
  const { lang } = useApp()
  const [title, setTitle] = useState(clip.title)
  const [text, setText] = useState(clip.text ?? '')
  return (
    <Card className="space-y-3">
      <p className="font-black">About this clip</p>
      <TextInput label="Title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => db.clips.update(clip.id, { title })} />
      <TextArea
        label="Transcript"
        hint="Type or paste what's said, so you can read along and check your pronunciation."
        rows={4}
        lang={lang}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => db.clips.update(clip.id, { text: text || undefined })}
      />
      <Button
        variant="danger"
        size="sm"
        icon={<Trash2 size={16} />}
        onClick={async () => {
          if (!confirm('Delete this clip from this device?')) return
          await db.clips.delete(clip.id)
          onDeleted()
        }}
      >
        Delete clip
      </Button>
    </Card>
  )
}

function Drills() {
  const { pack, profile, settings } = useApp()
  const [open, setOpen] = useState<string | undefined>(pack.drills[0]?.id)
  const say = (t: string) => speak(t, { locale: pack.speech.locale, voiceURI: profile?.voiceURI, rate: 0.8 })
  return (
    <div className="space-y-4">
      {pack.drills.map((d) => (
        <Card key={d.id}>
          <button className="w-full text-left" onClick={() => setOpen(open === d.id ? undefined : d.id)} aria-expanded={open === d.id}>
            <p className="text-lg font-black">{d.title}</p>
            <p className="text-sm font-semibold text-muted">{d.explain}</p>
          </button>
          {open === d.id && (
            <ul className="mt-4 space-y-4">
              {d.items.map((item, i) => (
                <li key={i} className="rounded-2xl bg-sunk p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {[item.a, item.b].filter((x): x is string => !!x).map((x) => (
                      <Button key={x} size="sm" icon={<Volume2 size={16} />} onClick={() => say(x)}>
                        <TL>{x}</TL>
                      </Button>
                    ))}
                    {settings.showEnglish && item.en && <span className="text-sm font-semibold text-muted">{item.en}</span>}
                  </div>
                  <div className="mt-3">
                    <PronunciationCheck target={item.b ? `${item.a} ${item.b}` : item.a} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  )
}
