// Remembers the last shadowing clip on this device, for the "Resume shadowing" shortcut.
// A per-device convenience, so it lives in localStorage (not in backups).

export interface LastShadow {
  week: number
  id: string // ShadowPlayer sourceId, e.g. "native:473111"
  text: string
  at: number
}

const key = (lang: string) => `parlons.lastShadow.${lang}`
const EVENT = 'parlons:lastShadow'

export function getLastShadow(lang: string): LastShadow | null {
  try {
    const v = JSON.parse(localStorage.getItem(key(lang)) ?? 'null') as LastShadow | null
    return v && typeof v.id === 'string' && typeof v.week === 'number' ? v : null
  } catch {
    return null
  }
}

export function setLastShadow(lang: string, v: Omit<LastShadow, 'at'>) {
  try {
    localStorage.setItem(key(lang), JSON.stringify({ ...v, at: Date.now() }))
    window.dispatchEvent(new Event(EVENT))
  } catch {
    /* private mode: the shortcut just won't appear */
  }
}

export const onLastShadowChange = (cb: () => void) => {
  window.addEventListener(EVENT, cb)
  return () => window.removeEventListener(EVENT, cb)
}

export const resumeUrl = (v: LastShadow) => `/shadowing?week=${v.week}&clip=${encodeURIComponent(v.id)}`
