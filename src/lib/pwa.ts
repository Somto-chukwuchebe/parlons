import { useSyncExternalStore } from 'react'

// Service-worker updates, in one place. A new version downloads in the background;
// the app then shows "Update" (banner + Settings). iPhone web apps are often resumed
// rather than reloaded, so we also check for updates whenever the app comes back to the
// foreground and every hour, instead of only at start-up.

export const APP_VERSION: string = __APP_VERSION__

interface State {
  needRefresh: boolean
  offlineReady: boolean
  checking: boolean
  lastChecked?: number
  supported: boolean
}

let state: State = { needRefresh: false, offlineReady: false, checking: false, supported: false }
const listeners = new Set<() => void>()
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

let applyUpdate: ((reload?: boolean) => Promise<void>) | null = null
let registration: ServiceWorkerRegistration | undefined
let started = false

export function startPwa() {
  if (started || import.meta.env.DEV || !('serviceWorker' in navigator)) return
  started = true
  set({ supported: true })
  void import('virtual:pwa-register').then(({ registerSW }) => {
    applyUpdate = registerSW({
      // Register now: by the time this runs, the page's "load" event has usually already
      // fired, and waiting for it (the default) would mean never registering at all.
      immediate: true,
      onNeedRefresh: () => set({ needRefresh: true }),
      onOfflineReady: () => set({ offlineReady: true }),
      onRegisteredSW: (_url, r) => {
        registration = r
        setInterval(() => void checkForUpdate(), 60 * 60_000)
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && void checkForUpdate())
      },
    })
  })
}

/** Ask the server whether a newer version exists. Resolves once the check is done. */
export async function checkForUpdate(): Promise<boolean> {
  if (!registration || !navigator.onLine) return state.needRefresh
  set({ checking: true })
  try {
    await registration.update()
    // Give a freshly found version a moment to finish installing.
    await new Promise((r) => setTimeout(r, 1500))
  } catch {
    /* offline or server hiccup: try again later */
  } finally {
    set({ checking: false, lastChecked: Date.now(), needRefresh: state.needRefresh || !!registration?.waiting })
  }
  return state.needRefresh
}

/** Switch to the downloaded version and reload. */
export async function installUpdate() {
  // Normal case: a new version is waiting; tell it to take over, and the page reloads when it does.
  // If nothing is waiting (e.g. this page loaded before offline support was installed, so the new
  // version activated straight away), a plain reload is all that's needed.
  if (applyUpdate && registration?.waiting) {
    await applyUpdate(true)
    // Safety net in case the "new version is in control" signal never arrives.
    setTimeout(() => location.reload(), 4000)
  } else {
    location.reload()
  }
}

export const dismissOfflineReady = () => set({ offlineReady: false })

export function usePwa(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}
