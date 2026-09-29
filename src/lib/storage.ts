// Persistent storage: ask the browser not to evict our data, and report usage.

export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.()
    if (!e) return null
    return { usage: e.usage ?? 0, quota: e.quota ?? 0 }
  } catch {
    return null
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}

/** Friendly message for a failed IndexedDB write. */
export function storageErrorMessage(e: unknown): string {
  const name = (e as { name?: string })?.name ?? ''
  if (name === 'QuotaExceededError' || /quota/i.test(String(e))) {
    return 'Your device is out of storage for this app. Export a backup, then delete some old recordings in Settings.'
  }
  return 'Something went wrong saving your data. Try again; if it keeps happening, export a backup from Settings.'
}
