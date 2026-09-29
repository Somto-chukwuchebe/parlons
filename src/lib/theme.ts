import type { LanguagePack } from '../packs/types'

/** Apply the pack accent colour and the light/dark preference to <html>. */
export function applyTheme(pack: LanguagePack | null, theme: 'system' | 'light' | 'dark') {
  const root = document.documentElement
  if (pack) {
    root.style.setProperty('--pack-accent', pack.accent.light)
    root.style.setProperty('--pack-accent-dark', pack.accent.dark)
    root.style.setProperty('--pack-accent-soft', pack.accent.soft)
    root.style.setProperty('--pack-accent-soft-dark', pack.accent.softDark)
  }
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.toggle('dark', dark)
}
