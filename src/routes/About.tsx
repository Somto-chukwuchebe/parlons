import { ExternalLink } from 'lucide-react'
import { useApp } from '../app/AppContext'
import { Card, PageHeader } from '../components/ui'
import { APP_NAME } from '../config'

// Credits for everything we didn't make ourselves. Required by the audio licences.
export function About() {
  const { pack } = useApp()
  const clips = pack.audio?.clips ?? []
  const speakers = [...new Map(clips.map((c) => [c.speaker, c])).values()]
  const count = (s: string) => clips.filter((c) => c.speaker === s).length

  return (
    <div className="max-w-3xl">
      <PageHeader back="/settings" title={`About ${APP_NAME}`} subtitle="A personal, non-commercial, speaking-first language app." />

      <Card className="space-y-4">
        <h2 className="text-xl font-black">Native-speaker audio</h2>
        <p className="font-semibold text-muted">
          The {pack.name} recordings used for shadowing and some review cards come from{' '}
          <a className="text-accent underline" href="https://tatoeba.org" target="_blank" rel="noreferrer">
            Tatoeba
          </a>
          , a collaborative collection of sentences and translations. Each recording is used under its speaker's licence, unchanged.
          Sentence texts and translations are from Tatoeba under CC BY 2.0 FR.
        </p>
        <ul className="divide-y-2 divide-line">
          {speakers.map((c) => (
            <li key={c.speaker} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <span>
                <a className="font-black text-accent underline" href={c.attribution} target="_blank" rel="noreferrer">
                  {c.speaker}
                </a>
                <span className="block text-sm font-semibold text-muted">{count(c.speaker)} recordings</span>
              </span>
              <a
                className="inline-flex items-center gap-1 rounded-full bg-sunk px-3 py-1 text-sm font-extrabold"
                href={c.license === 'CC BY-SA 4.0' ? 'https://creativecommons.org/licenses/by-sa/4.0/' : 'https://creativecommons.org/licenses/by-nc/4.0/'}
                target="_blank"
                rel="noreferrer"
              >
                {c.license} <ExternalLink size={14} />
              </a>
            </li>
          ))}
        </ul>
        <p className="text-sm font-semibold text-muted">
          CC BY-NC recordings are for non-commercial use only. If {APP_NAME} ever became a paid product, those would need to be replaced.
        </p>
      </Card>

      <Card className="mt-4 space-y-2">
        <h2 className="text-xl font-black">Also inside</h2>
        <ul className="list-disc space-y-1 pl-5 font-semibold text-muted">
          <li>Nunito font (SIL Open Font License), bundled so it works offline.</li>
          <li>Lucide icons (ISC licence).</li>
          <li>FSRS spaced-repetition algorithm via ts-fsrs (MIT).</li>
          <li>Course content written for this app.</li>
        </ul>
      </Card>
    </div>
  )
}
