import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate'
import { z } from 'zod'
import { APP_NAME } from '../config'
import { db, TABLES, type ParlonsDB, type TableName } from '../db/schema'

// Backup format: a .zip containing
//   backup.json  — every table; Dates as {"$date": iso}, Blobs as {"$blob": path, "type": mime}
//   audio/…      — one file per recording/clip blob
//
// Import: parse → preview (counts, date) → merge or replace.

export const BACKUP_FORMAT = 1

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

const EXT: Record<string, string> = {
  'audio/mp4': 'm4a',
  'audio/aac': 'aac',
  'audio/mpeg': 'mp3',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-m4a': 'm4a',
}
const extFor = (mime: string) => EXT[mime.split(';')[0]] ?? 'bin'

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  // Blob.arrayBuffer is missing in some older WebKit builds and in jsdom; FileReader works everywhere.
  if (typeof blob.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer())
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer))
    r.onerror = () => reject(r.error)
    r.readAsArrayBuffer(blob)
  })
}

/** Walk a value, replacing Dates and Blobs with JSON-safe markers. Blobs are collected into `files`. */
async function encode(value: unknown, path: string, files: Zippable): Promise<Json> {
  if (value === undefined) return null
  if (value === null || typeof value !== 'object') return value as Json
  if (value instanceof Date) return { $date: value.toISOString() }
  if (value instanceof Blob) {
    const name = `audio/${path}.${extFor(value.type)}`
    files[name] = [await blobBytes(value), { level: 0 }]
    return { $blob: name, type: value.type }
  }
  if (Array.isArray(value)) return Promise.all(value.map((v, i) => encode(v, `${path}-${i}`, files)))
  const out: Record<string, Json> = {}
  for (const [k, v] of Object.entries(value)) {
    if (v === undefined) continue
    out[k] = await encode(v, `${path}-${k}`, files)
  }
  return out
}

function decode(value: Json, files: Record<string, Uint8Array>): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => decode(v, files))
  if (typeof value.$date === 'string') return new Date(value.$date)
  if (typeof value.$blob === 'string') {
    const bytes = files[value.$blob]
    if (!bytes) throw new BackupError(`The backup is missing an audio file (${value.$blob}).`)
    return new Blob([bytes as BlobPart], { type: String(value.type ?? '') })
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) out[k] = decode(v, files)
  return out
}

export class BackupError extends Error {}

const BackupJson = z.object({
  app: z.string(),
  format: z.number(),
  schemaVersion: z.number(),
  exportedAt: z.string(),
  tables: z.record(z.string(), z.array(z.any())),
})

export interface BackupPreview {
  exportedAt: Date
  languages: string[]
  counts: Record<string, number>
  audioFiles: number
  sizeBytes: number
}

export interface ParsedBackup {
  preview: BackupPreview
  tables: Partial<Record<TableName, Record<string, unknown>[]>>
}

export async function exportBackup(database: ParlonsDB = db): Promise<Uint8Array> {
  const files: Zippable = {}
  const tables: Record<string, Json[]> = {}
  for (const name of TABLES) {
    const rows = await database.table(name).toArray()
    tables[name] = await Promise.all(
      rows.map((row, i) => encode(row, `${name}/${String((row as { id?: unknown }).id ?? i)}`, files)),
    )
  }
  const json = {
    app: APP_NAME,
    format: BACKUP_FORMAT,
    schemaVersion: database.verno,
    exportedAt: new Date().toISOString(),
    tables,
  }
  files['backup.json'] = strToU8(JSON.stringify(json))
  return zipSync(files)
}

export function parseBackup(zipBytes: Uint8Array): ParsedBackup {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(zipBytes)
  } catch {
    throw new BackupError("This file isn't a valid backup zip.")
  }
  const manifest = files['backup.json']
  if (!manifest) throw new BackupError("This zip doesn't contain a Parlons backup (backup.json is missing).")
  let raw: unknown
  try {
    raw = JSON.parse(strFromU8(manifest))
  } catch {
    throw new BackupError('The backup data is damaged and could not be read.')
  }
  const parsed = BackupJson.safeParse(raw)
  if (!parsed.success) throw new BackupError('The backup data has an unexpected format.')
  if (parsed.data.format > BACKUP_FORMAT) {
    throw new BackupError('This backup was made by a newer version of the app. Update the app first.')
  }

  const tables: ParsedBackup['tables'] = {}
  const counts: Record<string, number> = {}
  const langs = new Set<string>()
  for (const name of TABLES) {
    const rows = (parsed.data.tables[name] ?? []).map((r) => decode(r as Json, files) as Record<string, unknown>)
    tables[name] = rows
    counts[name] = rows.length
    for (const r of rows) if (typeof r.lang === 'string') langs.add(r.lang)
  }
  return {
    tables,
    preview: {
      exportedAt: new Date(parsed.data.exportedAt),
      languages: [...langs],
      counts,
      audioFiles: Object.keys(files).filter((f) => f.startsWith('audio/')).length,
      sizeBytes: zipBytes.byteLength,
    },
  }
}

/**
 * Restore a parsed backup.
 * - replace: wipe everything on this device, then load the backup.
 * - merge: keep this device's data and add anything from the backup it doesn't have.
 *   Where the same card exists on both, the one reviewed more often wins.
 */
export async function restoreBackup(parsed: ParsedBackup, mode: 'merge' | 'replace', database: ParlonsDB = db) {
  const tableObjs = TABLES.map((n) => database.table(n))
  await database.transaction('rw', tableObjs, async () => {
    if (mode === 'replace') {
      for (const t of tableObjs) await t.clear()
      for (const name of TABLES) {
        const rows = parsed.tables[name] ?? []
        if (rows.length) await database.table(name).bulkPut(rows)
      }
      return
    }

    for (const name of TABLES) {
      const rows = parsed.tables[name] ?? []
      if (!rows.length) continue
      const table = database.table(name)

      if (name === 'settings') continue // keep this device's settings
      if (name === 'reviewLogs') {
        // Auto-increment ids clash across devices: dedupe on (cardId, reviewedAt) instead.
        const existing = await table.toArray()
        const seen = new Set(existing.map((r) => `${r.cardId}|${r.reviewedAt}`))
        const fresh = rows
          .filter((r) => !seen.has(`${r.cardId}|${r.reviewedAt}`))
          .map(({ id: _id, ...rest }) => rest)
        if (fresh.length) await table.bulkAdd(fresh)
        continue
      }

      const pk = table.schema.primKey.keyPath as string
      const keys = rows.map((r) => r[pk] as string)
      const existing = await table.bulkGet(keys)
      const toPut: Record<string, unknown>[] = []
      rows.forEach((row, i) => {
        const current = existing[i] as Record<string, unknown> | undefined
        if (!current) toPut.push(row)
        else if (name === 'cards') {
          const reps = (r: Record<string, unknown>) => (r.fsrs as { reps?: number } | undefined)?.reps ?? 0
          if (reps(row) > reps(current)) toPut.push(row)
        }
      })
      if (toPut.length) await table.bulkPut(toPut)
    }
  })
}

export function backupFileName(date = new Date()) {
  const d = date.toISOString().slice(0, 10)
  return `${APP_NAME.toLowerCase()}-backup-${d}.zip`
}

/** Save or share a backup. Uses the share sheet where it can share files (iPhone/Android). */
export async function deliverBackup(bytes: Uint8Array): Promise<'shared' | 'downloaded'> {
  const name = backupFileName()
  const file = new File([bytes as BlobPart], name, { type: 'application/zip' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `${APP_NAME} backup` })
      return 'shared'
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      // Fall through to a download if sharing failed for another reason.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
}
