import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS, type AppSettings, type Profile } from '../db/schema'
import { loadPack } from '../packs'
import type { LanguagePack } from '../packs/types'
import { applyTheme } from '../lib/theme'
import { Logo } from '../components/Logo'
import { buildPlan, toDayKey, type ProgramPlan } from '../lib/program'

interface AppState {
  settings: AppSettings
  lang: string
  pack: LanguagePack
  profile: Profile | undefined
  plan: ProgramPlan | undefined
  today: string
  /** Apply the pack's typography to target-language text. */
  t: (text: string) => string
}

const Ctx = createContext<AppState | null>(null)

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside <AppProvider>')
  return v
}

/** Today's date key; refreshes at midnight and when the app comes back to the foreground. */
function useToday() {
  const [today, setToday] = useState(() => toDayKey(new Date()))
  useEffect(() => {
    const tick = () => setToday(toDayKey(new Date()))
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return today
}

export function AppProvider({ children }: { children: ReactNode }) {
  // useLiveQuery returns undefined while loading, so "not saved" is mapped to null to tell
  // the two apart. Deciding before the data has loaded sent people to setup on every
  // start on slower devices (iPhone), even though their profile was saved.
  const settingsRow = useLiveQuery(async () => (await db.settings.get('app')) ?? null, [])
  const loadedSettings = settingsRow ?? DEFAULT_SETTINGS
  const lang = loadedSettings.activeLang
  const profileRow = useLiveQuery(async () => ({ lang, row: (await db.profiles.get(lang)) ?? null }), [lang])
  // Only trust a result for the current language (the query re-runs when it changes).
  const profileReady = settingsRow !== undefined && profileRow !== undefined && profileRow.lang === lang
  const profile = profileRow?.row ?? undefined
  const [pack, setPack] = useState<LanguagePack | null>(null)
  const [error, setError] = useState<string | null>(null)
  const today = useToday()

  useEffect(() => {
    let cancelled = false
    loadPack(lang)
      .then((p) => !cancelled && setPack(p))
      .catch((e: Error) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [lang])

  useEffect(() => {
    applyTheme(pack, loadedSettings.theme)
    if (loadedSettings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme(pack, 'system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pack, loadedSettings.theme])

  const value = useMemo<AppState | null>(() => {
    if (!pack || !profileReady) return null
    return {
      settings: loadedSettings,
      lang,
      pack,
      profile,
      plan: profile ? buildPlan(profile.startDate) : undefined,
      today,
      t: pack.typography,
    }
  }, [pack, profileReady, loadedSettings, lang, profile, today])

  if (error) {
    return (
      <div className="p-6 text-danger-ink" role="alert">
        Couldn't load the course content: {error}
      </div>
    )
  }
  if (!value)
    return (
      <div className="grid min-h-dvh place-items-center bg-navy" role="status" aria-label="Loading">
        <Logo size={96} className="pop-in" />
      </div>
    )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
