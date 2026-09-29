import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { formatDistanceToNow, format } from 'date-fns'
import { useApp } from '../app/AppContext'
import { Button, Card, Notice, PageHeader, Segmented } from '../components/ui'
import { updateSettings } from '../db/schema'
import { BackupError, deliverBackup, exportBackup, parseBackup, restoreBackup, type ParsedBackup } from '../lib/backup'
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
  const { settings, pack } = useApp()
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null)
  const [pending, setPending] = useState<ParsedBackup | null>(null)
  const [mode, setMode] = useState<'merge' | 'replace'>('merge')
  const fileRef = useRef<HTMLInputElement>(null)

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
    <div className="space-y-4">
      <PageHeader title="Settings" />

      <Card className="space-y-3">
        <h2 className="font-semibold">Appearance</h2>
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
        <label className="flex min-h-12 items-center justify-between gap-3">
          <span>Show English translations</span>
          <input
            type="checkbox"
            className="h-6 w-6 accent-[var(--accent)]"
            checked={settings.showEnglish}
            onChange={(e) => updateSettings({ showEnglish: e.target.checked })}
          />
        </label>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Backup and moving devices</h2>
        <p className="text-sm text-muted">
          One file with everything: progress, phrases and all your recordings.{' '}
          {settings.lastBackupAt
            ? `Last backup ${formatDistanceToNow(settings.lastBackupAt, { addSuffix: true })}.`
            : 'No backup yet.'}
        </p>
        <Button className="w-full" onClick={doExport} disabled={busy}>
          {busy ? 'Working…' : 'Export backup'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          id="import-file"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()} disabled={busy}>
          Import a backup…
        </Button>

        {pending && (
          <div className="space-y-3 rounded-xl border border-line p-3">
            <p className="font-medium">
              Backup from {format(pending.preview.exportedAt, 'd MMM yyyy, HH:mm')} ·{' '}
              {formatBytes(pending.preview.sizeBytes)}
            </p>
            <ul className="grid grid-cols-2 gap-x-4 text-sm">
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
            <p className="text-sm text-muted">
              {mode === 'merge'
                ? 'Keeps everything on this device and adds what the backup has that this device doesn’t.'
                : 'Deletes everything on this device first, then loads the backup exactly.'}
            </p>
            <div className="flex gap-2">
              <Button variant={mode === 'replace' ? 'danger' : 'primary'} onClick={doRestore} disabled={busy}>
                {mode === 'replace' ? 'Replace my data' : 'Merge'}
              </Button>
              <Button variant="secondary" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Storage on this device</h2>
        {storage ? (
          <>
            <p className="text-sm">
              Using <strong>{formatBytes(storage.usage)}</strong>
              {storage.quota ? ` of about ${formatBytes(storage.quota)} available` : ''}.
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden>
              <div
                className="h-full bg-accent"
                style={{ width: `${Math.min(100, (storage.usage / Math.max(storage.quota, 1)) * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">This browser doesn't report storage usage.</p>
        )}
        <p className="text-sm text-muted">
          {settings.storagePersisted
            ? 'Protected: the browser won’t clear this data to free up space.'
            : 'Not yet protected: the browser could clear data if the device runs low on space. Installing the app to your home screen usually fixes this.'}
        </p>
        {!settings.storagePersisted && (
          <Button
            variant="secondary"
            onClick={async () => updateSettings({ storagePersisted: await requestPersistence() })}
          >
            Ask to protect my data
          </Button>
        )}
      </Card>

      <Card className="space-y-2">
        <h2 className="font-semibold">Course</h2>
        <p className="text-sm">
          Learning: <strong>{pack.name}</strong> ({pack.nativeName})
        </p>
        <p className="text-sm text-muted">More languages coming.</p>
        <Link to="/welcome" className="inline-block py-2 text-accent">
          Change start date, daily time or voice →
        </Link>
      </Card>

      <Card>
        <Link to="/install" className="block py-2 text-accent">
          Install {APP_NAME} on this device →
        </Link>
      </Card>
    </div>
  )
}
