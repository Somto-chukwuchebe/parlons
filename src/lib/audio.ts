import type { AudioClip, LanguagePack } from '../packs/types'

// Bundled native-speaker clips (see scripts/build-audio.mjs) and playback helpers.

export const clipUrl = (lang: string, id: number) => `${import.meta.env.BASE_URL}audio/${lang}/${id}.mp3`

/** Native recording for a course phrase, if one exists. */
export function nativeClipFor(pack: LanguagePack, seedId: string | undefined): AudioClip | undefined {
  if (!seedId || !pack.audio) return undefined
  return pack.audio.clips.find((c) => c.seedIds.includes(seedId))
}

/** This week's shadowing set. */
export const shadowClips = (pack: LanguagePack, week: number) => pack.audio?.clips.filter((c) => c.shadow && c.week === week) ?? []

let current: HTMLAudioElement | null = null

/** Play a URL once; resolves when it ends (or fails). Stops anything already playing. */
export function playUrl(url: string, rate = 1): Promise<void> {
  current?.pause()
  const a = new Audio(url)
  a.playbackRate = rate
  ;(a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true
  current = a
  return new Promise((resolve) => {
    a.onended = () => resolve()
    a.onerror = () => resolve()
    a.play().catch(() => resolve())
  })
}

export function stopAudio() {
  current?.pause()
  current = null
}
