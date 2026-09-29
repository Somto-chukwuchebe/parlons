// A gentle two-note chime made with the Web Audio API (no sound files needed).

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Call from a tap handler once, so iOS allows sound later without a tap. */
export function unlockAudio() {
  audio()
}

function note(ac: AudioContext, freq: number, start: number, length = 1.2, volume = 0.18) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + length + 0.05)
}

/** Soft "time's up" chime: a rising fifth. */
export function chime() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + 0.02
  note(ac, 659.25, t) // E5
  note(ac, 987.77, t + 0.18) // B5
}

/** Brighter three-note arpeggio for finishing a session. */
export function fanfare() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + 0.02
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(ac, f, t + i * 0.12, 1.4, 0.14))
}
