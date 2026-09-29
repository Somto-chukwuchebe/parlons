import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Button, Card, Notice } from '../components/ui'
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
    <div className="pt-safe px-safe pb-safe mx-auto max-w-xl space-y-4 py-6">
      <header className="flex items-center gap-2">
        <Link to="/settings" className="-ml-2 rounded-lg p-2 text-accent" aria-label="Back">
          ←
        </Link>
        <h1 className="text-2xl font-semibold">Install on this device</h1>
      </header>

      {standalone ? (
        <Notice>You're using the installed app. Nothing else to do here.</Notice>
      ) : (
        <p className="text-muted">
          Installing puts {APP_NAME} on your home screen or Dock, runs it full-screen, works offline (e.g. on the
          metro) and makes it much less likely your data gets cleared.
        </p>
      )}

      {canPrompt && !standalone && (
        <Button size="lg" className="w-full" onClick={() => promptInstall().then(() => setCanPrompt(false))}>
          Install {APP_NAME}
        </Button>
      )}

      {mine && (
        <Card className="border-accent">
          <h2 className="mb-2 font-semibold">{mine.title} — this device</h2>
          <ol className="list-decimal space-y-2 pl-5">{mine.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </Card>
      )}

      <h2 className="pt-2 font-semibold">Other devices</h2>
      {others.map((g) => (
        <details key={g.id} className="rounded-2xl border border-line bg-surface p-4">
          <summary className="cursor-pointer font-medium">{g.title}</summary>
          <ol className="mt-2 list-decimal space-y-2 pl-5">{g.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </details>
      ))}

      <Card>
        <h2 className="mb-1 font-semibold">Each device keeps its own data</h2>
        <p className="text-sm text-muted">
          There's no account or cloud sync. To move your progress, go to Settings → Export backup on one device and
          Import it on the other.
        </p>
      </Card>
    </div>
  )
}
