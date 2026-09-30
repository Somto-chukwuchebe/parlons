import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArchiveRestore, BadgeInfo, BellRing, Download, RefreshCw, Sparkles, HardDrive, Languages, Palette, ShieldAlert, ShieldCheck, SlidersHorizontal, Smartphone, Upload } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useApp } from '../app/AppContext'
import { Button, Card, LinkButton, Notice, PageHeader, Segmented, Toggle } from '../components/ui'
import { updateSettings } from '../db/schema'
import { BackupError, deliverBackup, deliverFile, exportBackup, parseBackup, restoreBackup, type ParsedBackup } from '../lib/backup'
import { buildIcs } from '../lib/ics'
import { allowBadge, badgeSupport, type BadgeSupport } from '../lib/badge'
import { APP_VERSION, checkForUpdate, installUpdate, usePwa } from '../lib/pwa'
import { toDayKey } from '../lib/program'
import { PROGRAM_DAYS } from '../config'
import { formatBytes, requestPersistence, storageErrorMessage, storageEstimate } from '../lib/storage'
import { APP_NAME } from '../config'

const TABLE_LABELS: Record<string, string> = {
  cards: 'Phrase cards',
  reviewLogs: 'Reviews',
  sessions: 'Sessions',
  recordings: 'Recordings',
  clips: 'Shadowing clips',
  conversations: 'Conversations',
  mistakes: 'Mistakes',
  aiReports: 'AI reports',
  weeklyReviews: 'Weekly reviews',
  canDo: 'Can-do ticks',
  seedOverrides: 'Course edits',
  profiles: 'Language profiles',
}

export function Settings() {
  const { settings, pack, profile } = useApp()
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null)
  const [pending, setPending] = useState<ParsedBackup | null>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const fileRef = useRef<HTMLInputElement>(null)
  const pwa = usePwa()
  const [checkResult, setCheckResult] = useState<string | null>(null)
  const [badge, setBadge] = useState<BadgeSupport>(() => badgeSupport())

  useEffect(() => {
    storageEstimate().then(setStorage)
  }, [busy])

  async function doExport() {
    setBusy(true)
    setMessage(null)
    try {
      const bytes = await exportBackup()
      const how = await deliverBackup(bytes)
      await updateSettings({ lastBackupAt: Date.now() })
      setMessage({
        tone: 'info',
        text:
          how === 'shared'
            ? `Backup shared (${formatBytes(bytes.byteLength)}). Save it to Files or iCloud Drive.`
            : `Backup downloaded (${formatBytes(bytes.byteLength)}). Keep it somewhere safe, e.g. iCloud Drive.`,
      })
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setMessage({ tone: 'danger', text: storageErrorMessage(e) })
    } finally {
      setBusy(false)
    }
  }

  async function onFile(file: File) {
    setMessage(null)
    try {
      setPending(parseBackup(new Uint8Array(await file.arrayBuffer())))
    } catch (e) {
      setMessage({ tone: 'danger', text: e instanceof BackupError ? e.message : "That file couldn't be read." })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function doRestore() {
    if (!pending) return
    setBusy(true)
    try {
      await restoreBackup(pending, mode)
      setPending(null)
      setMessage({ tone: 'info', text: mode === 'replace' ? 'Backup restored.' : 'Backup merged into this device.' })
    } catch (e) {
      setMessage({ tone: 'danger', text: storageErrorMessage(e) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader back="/more" title="Settings" subtitle="Your data stays on this device." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <CardTitle icon={<Palette size={22} />} title="Appearance" />
          <Segmented
            label="Theme"
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'system', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
          <Toggle
            label="Show English translations"
            hint="Hide them to test yourself; you can still reveal them per card."
            checked={settings.showEnglish}
            onChange={(v) => updateSettings({ showEnglish: v })}
          />
        </Card>

        <Card className="space-y-4 self-start">
          <CardTitle icon={<ArchiveRestore size={22} />} title="Backup and moving devices" />
          <p className="font-semibold text-muted">
            One file with everything: progress, phrases and all your recordings.{' '}
            {settings.lastBackupAt
              ? `Last backup ${formatDistanceToNow(settings.lastBackupAt, { addSuffix: true })}.`
              : 'No backup yet.'}
          </p>
          <Button variant="primary" size="lg" className="w-full" icon={<Download size={20} />} onClick={doExport} disabled={busy}>
            {busy ? 'Working…' : 'Export backup'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <Button size="lg" className="w-full" icon={<Upload size={20} />} onClick={() => fileRef.current?.click()} disabled={busy}>
            Import a backup…
          </Button>

          {pending && (
            <div className="space-y-4 rounded-2xl bg-sunk p-4">
              <p className="font-black">
                Backup from {format(pending.preview.exportedAt, 'd MMM yyyy, HH:mm')} · {formatBytes(pending.preview.sizeBytes)}
              </p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-semibold">
                {Object.entries(pending.preview.counts)
                  .filter(([k, n]) => n > 0 && TABLE_LABELS[k])
                  .map(([k, n]) => (
                    <li key={k}>
                      {TABLE_LABELS[k]}: <strong>{n}</strong>
                    </li>
                  ))}
              </ul>
              <Segmented
                label="Import mode"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'merge', label: 'Merge' },
                  { value: 'replace', label: 'Replace' },
                ]}
              />
              <p className="text-sm font-semibold text-muted">
                {mode === 'merge'
                  ? 'Keeps everything on this device and adds what the backup has that this device doesn\u2019t.'
                  : 'Deletes everything on this device first, then loads the backup exactly.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant={mode === 'replace' ? 'rouge' : 'primary'} onClick={doRestore} disabled={busy}>
                  {mode === 'replace' ? 'Replace my data' : 'Merge'}
                </Button>
                <Button onClick={() => setPending(null)}>Cancel</Button>
              </div>
            </div>
          )}
          {message && <Notice tone={message.tone}>{message.text}</Notice>}
        </Card>

        <Card className="space-y-3">
          <CardTitle icon={<Sparkles size={22} />} title="App version and updates" />
          <p className="font-semibold">
            Version <span className="font-black tabular-nums">{APP_VERSION}</span>
          </p>
          {pwa.needRefresh ? (
            <Button variant="primary" icon={<RefreshCw size={18} />} onClick={installUpdate}>
              Update now
            </Button>
          ) : (
            <Button
              icon={<RefreshCw size={18} className={pwa.checking ? 'animate-spin' : ''} />}
              disabled={pwa.checking || !pwa.supported}
              onClick={async () => {
                setCheckResult(null)
                const found = await checkForUpdate()
                setCheckResult(found ? null : navigator.onLine ? "You're on the latest version." : "You're offline. Connect to the internet to check.")
              }}
            >
              {pwa.checking ? 'Checking…' : 'Check for updates'}
            </Button>
          )}
          {!pwa.supported && <p className="text-sm font-semibold text-muted">Updates are automatic in this browser; reload the page to get the newest version.</p>}
          {checkResult && <Notice tone="good">{checkResult}</Notice>}
          <p className="text-xs font-semibold text-muted">
            Parlons checks for new versions whenever you open it while online. Updating keeps all your data and recordings.
          </p>
        </Card>

        <Card className="space-y-3">
          <CardTitle icon={<BadgeInfo size={22} />} title="Number on the app icon" />
          <Toggle
            label="Show phrases for today on the icon"
            hint="Due reviews plus today's new phrases. It refreshes whenever you open Parlons."
            checked={!!settings.badge}
            onChange={async (on) => {
              if (on) setBadge(await allowBadge())
              await updateSettings({ badge: on })
            }}
          />
          {settings.badge && badge !== 'yes' && (
            <Notice tone="warn">
              {badge === 'needs-permission' && 'Allow notifications for Parlons when asked: Apple only shows icon numbers for apps with that permission. Parlons never sends notifications.'}
              {badge === 'blocked' && 'Notifications are turned off for Parlons, so the icon number can’t show. On iPhone: Settings → Notifications → Parlons → Allow.'}
              {badge === 'home-screen-only' && 'This works from the home-screen app, not in Safari. Open Parlons from its icon and turn this on there.'}
              {badge === 'no' && 'This browser can’t show numbers on app icons. It works on iPhone (home-screen app), and on Chrome or Edge on laptops.'}
            </Notice>
          )}
        </Card>

        <Card className="space-y-3">
          <CardTitle icon={<BellRing size={22} />} title="Daily reminder" />
          <p className="font-semibold text-muted">
            Adds a daily {profile?.dailyMinutes ?? 30}-minute study event at <strong>{profile?.studyTime ?? '07:30'}</strong> to your phone's calendar for all{' '}
            {PROGRAM_DAYS} days, with an alert. Works reliably on iPhone, no notifications permission needed.
          </p>
          <Button
            icon={<BellRing size={18} />}
            disabled={!profile}
            onClick={async () => {
              if (!profile) return
              const ics = buildIcs({
                appName: APP_NAME,
                startDate: profile.startDate > toDayKey(new Date()) ? profile.startDate : toDayKey(new Date()),
                days: PROGRAM_DAYS,
                time: profile.studyTime,
                minutes: profile.dailyMinutes,
                url: `${location.origin}${import.meta.env.BASE_URL}`,
              })
              try {
                await deliverFile(ics, `${APP_NAME.toLowerCase()}-reminder.ics`, 'text/calendar', `${APP_NAME} reminder`)
              } catch {
                /* share cancelled */
              }
            }}
          >
            Add to my calendar
          </Button>
          <p className="text-xs font-semibold text-muted">
            On iPhone: choose the Calendar app (or save to Files, then tap the file). To change the time, update it in "Start date, daily time and voice", then add
            it again and delete the old event.
          </p>
        </Card>

        <Card className="space-y-3">
          <CardTitle icon={<HardDrive size={22} />} title="Storage on this device" />
          {storage ? (
            <>
              <p className="font-semibold">
                Using <strong>{formatBytes(storage.usage)}</strong>
                {storage.quota ? ` of about ${formatBytes(storage.quota)} available` : ''}.
              </p>
              <div className="h-3 overflow-hidden rounded-full bg-sunk" aria-hidden>
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, Math.min(100, (storage.usage / Math.max(storage.quota, 1)) * 100))}%` }} />
              </div>
            </>
          ) : (
            <p className="font-semibold text-muted">This browser doesn't report storage usage.</p>
          )}
          {settings.storagePersisted ? (
            <Notice tone="good" icon={<ShieldCheck size={20} />}>Protected: the browser won't clear this data to free up space.</Notice>
          ) : (
            <>
              <Notice tone="warn" icon={<ShieldAlert size={20} />}>
                Not yet protected: the browser could clear data if the device runs low on space. Installing the app usually fixes this.
              </Notice>
              <Button onClick={async () => updateSettings({ storagePersisted: await requestPersistence() })}>Ask to protect my data</Button>
            </>
          )}
        </Card>

        <Card className="space-y-3">
          <CardTitle icon={<Languages size={22} />} title="Course" />
          <p className="font-semibold">
            Learning <strong>{pack.name}</strong> ({pack.nativeName})
          </p>
          <p className="text-sm font-semibold text-muted">More languages coming.</p>
          <LinkButton to="/welcome" icon={<SlidersHorizontal size={18} />}>
            Start date, daily time and voice
          </LinkButton>
        </Card>

        <Card className="space-y-3">
          <CardTitle icon={<Smartphone size={22} />} title={`Install ${APP_NAME}`} />
          <p className="text-sm font-semibold text-muted">Home screen or Dock, full-screen, and offline on the metro.</p>
          <LinkButton to="/install" icon={<Download size={18} />}>
            How to install on this device
          </LinkButton>
          <LinkButton to="/about" variant="ghost">
            About and credits
          </LinkButton>
        </Card>
      </div>
    </div>
  )
}

function CardTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-black">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</span>
      {title}
    </h2>
  )
}
