import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS, type AppSettings, type Profile } from '../db/schema'
import { loadPack } from '../packs'
import type { LanguagePack } from '../packs/types'
import { applyTheme } from '../lib/theme'
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
  const settings = useLiveQuery(() => db.settings.get('app'), [], undefined)
  const loadedSettings = settings ?? DEFAULT_SETTINGS
  const lang = loadedSettings.activeLang
  const profile = useLiveQuery(() => db.profiles.get(lang), [lang])
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
    if (!pack) return null
    return {
      settings: loadedSettings,
      lang,
      pack,
      profile,
      plan: profile ? buildPlan(profile.startDate) : undefined,
      today,
      t: pack.typography,
    }
  }, [pack, loadedSettings, lang, profile, today])

  if (error) {
    return (
      <div className="p-6 text-danger-ink" role="alert">
        Couldn't load the course content: {error}
      </div>
    )
  }
  if (!value) return <div className="p-6 text-muted">Loading…</div>
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
