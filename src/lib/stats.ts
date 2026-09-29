import type { ConversationRow, RecordingRow } from '../db/schema'

// Honest speaking totals: time you actually spoke on record (recordings) plus logged
// calls with real people and AI sessions.

export function speakingSeconds(recordings: Pick<RecordingRow, 'durationSec'>[], conversations: Pick<ConversationRow, 'durationMin'>[]) {
  return recordings.reduce((n, r) => n + r.durationSec, 0) + conversations.reduce((n, c) => n + c.durationMin * 60, 0)
}

export function averageRating(recordings: Pick<RecordingRow, 'ratings'>[]): number | null {
  const vals = recordings.flatMap((r) => Object.values(r.ratings ?? {}).filter((v): v is number => typeof v === 'number' && v > 0))
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null
}
