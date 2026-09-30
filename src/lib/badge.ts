import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { queueStats } from './srs'

// The number on the app icon: phrases for today (due reviews + today's new cards).
// Web apps can only change it while open, so it refreshes whenever Parlons is used.

type BadgeNavigator = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> }

export type BadgeSupport =
  | 'yes' // works now
  | 'needs-permission' // iPhone/iPad/Safari: works once notifications are allowed (none are ever sent)
  | 'blocked' // notifications were refused for this app
  | 'home-screen-only' // iPhone/iPad in the browser: only works from the home-screen icon
  | 'no' // this browser can't show badges

const isAppleWebKit = () => /iPhone|iPad|Macintosh/.test(navigator.userAgent) && !/Chrome|CriOS|Edg|Firefox|FxiOS/.test(navigator.userAgent)
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export function badgeSupport(): BadgeSupport {
  const nav = navigator as BadgeNavigator
  const iOS = /iPhone|iPad/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
  if (typeof nav.setAppBadge !== 'function') return iOS && !isStandalone() ? 'home-screen-only' : 'no'
  if (isAppleWebKit() && typeof Notification !== 'undefined') {
    if (Notification.permission === 'denied') return 'blocked'
    if (Notification.permission !== 'granted') return 'needs-permission'
  }
  return 'yes'
}

/** Ask for the permission the badge needs (only where needed). Must be called from a tap. */
export async function allowBadge(): Promise<BadgeSupport> {
  if (badgeSupport() === 'needs-permission') {
    try {
      await Notification.requestPermission()
    } catch {
      /* older Safari */
    }
  }
  return badgeSupport()
}

export async function showBadge(n: number) {
  const nav = navigator as BadgeNavigator
  try {
    if (n > 0) await nav.setAppBadge?.(n)
    else await nav.clearAppBadge?.()
  } catch {
    /* not allowed here; harmless */
  }
}

/** Keeps the icon number in step with the phrase queue while the app is open. */
export function useAppBadge(lang: string, enabled: boolean) {
  const cards = useLiveQuery(() => db.cards.where('lang').equals(lang).count(), [lang], 0)
  const reviews = useLiveQuery(() => db.reviewLogs.where('lang').equals(lang).count(), [lang], 0)
  useEffect(() => {
    if (!enabled) {
      void showBadge(0)
      return
    }
    const update = () => queueStats(lang).then((s) => showBadge(s.dueReviews + s.newAvailable))
    void update()
    const id = setInterval(update, 5 * 60_000)
    const onVis = () => document.visibilityState === 'visible' && void update()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [lang, enabled, cards, reviews])
}
