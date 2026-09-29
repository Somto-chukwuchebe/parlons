import { useEffect, useState, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { Button, Card, Notice, PageHeader } from '../components/ui'
import { APP_NAME } from '../config'
import { canPromptInstall, detectPlatform, isStandalone, onInstallAvailability, promptInstall, type Platform } from '../lib/install'

const GUIDES: { id: Platform; title: string; steps: ReactNode[] }[] = [
  {
    id: 'ios-safari',
    title: 'iPhone or iPad (Safari)',
    steps: [
      <>Open this page in <strong>Safari</strong>.</>,
      <>Tap the <strong>Share</strong> button (square with an arrow) at the bottom of the screen.</>,
      <>Scroll down and tap <strong>Add to Home Screen</strong>.</>,
      <>Check the name says “{APP_NAME}” and tap <strong>Add</strong>.</>,
      <>Open {APP_NAME} from your home screen once while online, so it saves itself for offline use.</>,
    ],
  },
  {
    id: 'ios-other',
    title: 'iPhone or iPad (Chrome, Firefox, Edge)',
    steps: [
      <>Tap the <strong>Share</strong> button in the address bar (or the ⋯ menu, then Share).</>,
      <>Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</>,
      <>If you don't see the option, copy the link and open it in Safari instead.</>,
    ],
  },
  {
    id: 'mac-safari',
    title: 'Mac (Safari)',
    steps: [
      <>In the menu bar, choose <strong>File → Add to Dock…</strong></>,
      <>Click <strong>Add</strong>. {APP_NAME} now opens in its own window from the Dock and Launchpad.</>,
    ],
  },
  {
    id: 'desktop-chromium',
    title: 'Mac, Windows or Linux (Chrome or Edge)',
    steps: [
      <>Click the <strong>install icon</strong> at the right end of the address bar (a screen with a down arrow), or use the button above.</>,
      <>Or open the ⋮ menu → <strong>Cast, save and share → Install page as app</strong> (Edge: Apps → Install this site as an app).</>,
    ],
  },
  {
    id: 'android',
    title: 'Android (Chrome)',
    steps: [
      <>Tap the button above if it appears, or open the ⋮ menu.</>,
      <>Tap <strong>Add to Home screen</strong> → <strong>Install</strong>.</>,
      <>Samsung Internet: menu → <strong>Add page to</strong> → <strong>Home screen</strong>.</>,
    ],
  },
  {
    id: 'firefox',
    title: 'Firefox on a laptop',
    steps: [
      <>Desktop Firefox can't install web apps. The app still works in a normal tab, including offline after the first visit.</>,
      <>For an app window, open this page in Chrome, Edge or Safari instead.</>,
    ],
  },
]

export function Install() {
  const platform = detectPlatform()
  const [canPrompt, setCanPrompt] = useState(canPromptInstall())
  const standalone = isStandalone()
  useEffect(() => {
    const off = onInstallAvailability(() => setCanPrompt(canPromptInstall()))
    return () => {
      off()
    }
  }, [])

  const mine = GUIDES.find((g) => g.id === platform)
  const others = GUIDES.filter((g) => g.id !== platform)

  return (
    <div className="safe-top safe-x safe-bottom mx-auto max-w-2xl space-y-5 px-5 py-8">
      <PageHeader back="/settings" title="Install on this device" subtitle={`${APP_NAME} works best installed: full-screen, offline, and safer for your data.`} />

      {standalone ? (
        <Notice>You're using the installed app. Nothing else to do here.</Notice>
      ) : (
        <p className="font-semibold text-muted">
          Installing puts {APP_NAME} on your home screen or Dock, works offline (e.g. on the metro) and makes it much less
          likely your data gets cleared.
        </p>
      )}

      {canPrompt && !standalone && (
        <Button variant="primary" size="xl" className="w-full" icon={<Download size={24} />} onClick={() => promptInstall().then(() => setCanPrompt(false))}>
          Install {APP_NAME}
        </Button>
      )}

      {mine && (
        <Card className="border-accent">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-accent">This device</p>
          <h2 className="mb-4 text-2xl font-black">{mine.title}</h2>
          <ol className="space-y-3">
            {mine.steps.map((s, i) => (
              <li key={i} className="flex gap-3 font-semibold">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-black text-on-accent">{i + 1}</span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <h2 className="pt-2 text-xl font-black">Other devices</h2>
      {others.map((g) => (
        <details key={g.id} className="rounded-3xl border-2 border-line bg-surface p-5">
          <summary className="cursor-pointer font-extrabold">{g.title}</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-5 font-semibold">{g.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </details>
      ))}

      <Card>
        <h2 className="mb-1 text-lg font-black">Each device keeps its own data</h2>
        <p className="text-sm font-semibold text-muted">
          There's no account or cloud sync. To move your progress, go to Settings → Export backup on one device and
          Import it on the other.
        </p>
      </Card>
    </div>
  )
}
