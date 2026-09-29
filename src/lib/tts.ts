// Text-to-speech through the browser's Web Speech API.
// Apple devices ship offline French voices; availability elsewhere varies. Never throws.

export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** Voices for a locale (e.g. fr-FR), preferred names first. Waits briefly for voices to load. */
export async function voicesFor(locale: string, preferred: string[] = []): Promise<SpeechSynthesisVoice[]> {
  if (!ttsSupported()) return []
  const synth = window.speechSynthesis
  let voices = synth.getVoices()
  if (!voices.length) {
    voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const done = () => resolve(synth.getVoices())
      synth.addEventListener('voiceschanged', done, { once: true })
      setTimeout(done, 1500)
    })
  }
  const lang = locale.split('-')[0]
  const matches = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(lang))
  const rank = (v: SpeechSynthesisVoice) => {
    const i = preferred.findIndex((p) => v.name.includes(p))
    // Exact locale (fr-FR over fr-CA/fr-BE) matters most, then the pack's preferred names.
    const exactLocale = v.lang.replace('_', '-') === locale ? 0 : 1
    return exactLocale * 1000 + (i === -1 ? 100 : i)
  }
  return matches.sort((a, b) => rank(a) - rank(b))
}

export interface SpeakOptions {
  locale: string
  voiceURI?: string
  rate?: number
}

let cachedVoices: SpeechSynthesisVoice[] = []

/** Speak text. Resolves when finished (or immediately if TTS is unavailable). */
export async function speak(text: string, opts: SpeakOptions): Promise<void> {
  if (!ttsSupported()) return
  const synth = window.speechSynthesis
  synth.cancel()
  if (!cachedVoices.length) cachedVoices = await voicesFor(opts.locale)
  const u = new SpeechSynthesisUtterance(text)
  u.lang = opts.locale
  u.rate = opts.rate ?? 1
  const voice = cachedVoices.find((v) => v.voiceURI === opts.voiceURI) ?? cachedVoices[0]
  if (voice) u.voice = voice
  await new Promise<void>((resolve) => {
    u.onend = () => resolve()
    u.onerror = () => resolve()
    synth.speak(u)
  })
}

export function stopSpeaking() {
  if (ttsSupported()) window.speechSynthesis.cancel()
}
