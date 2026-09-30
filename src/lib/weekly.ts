import type { StageId } from '../db/schema'

// Rule-based advice for the Sunday review: which stage deserves more time next week.
// Deliberately simple and explainable; each rule says why.

export interface WeekSignals {
  studyMinutes: number
  stageMinutes: Record<StageId, number>
  recordingsCount: number
  avgPronunciation: number | null // 1–5 self-ratings, if any
  againRate: number | null // share of reviews graded "Again"
  mistakesByCategory: Record<string, number>
  callsOrRolePlays: number
  daysStudied: number
}

export interface Suggestion {
  stage: StageId
  reason: string
}

const GRAMMAR = ['gender', 'verb', 'tense', 'order', 'prep']

export function suggestStage(s: WeekSignals): Suggestion {
  const total = Math.max(1, Object.values(s.stageMinutes).reduce((a, b) => a + b, 0))
  const speaking = s.stageMinutes.speak + s.stageMinutes.conversation + s.stageMinutes.shadowing
  const grammarMistakes = GRAMMAR.reduce((n, c) => n + (s.mistakesByCategory[c] ?? 0), 0)
  const pronMistakes = s.mistakesByCategory.pron ?? 0

  if (s.daysStudied <= 2)
    return { stage: 'review', reason: 'Few study days this week. Aim for short daily sessions (even 10 minutes) before adding more time anywhere.' }
  if (s.againRate !== null && s.againRate > 0.3)
    return { stage: 'review', reason: `You pressed "Again" on ${Math.round(s.againRate * 100)}% of reviews. A few more review minutes will help phrases stick.` }
  if (s.recordingsCount === 0 || speaking / total < 0.35)
    return { stage: 'speak', reason: 'Less than a third of your time was spent speaking. Give the Speak stage more time: answering out loud is what builds fluency.' }
  if ((s.avgPronunciation !== null && s.avgPronunciation < 3) || pronMistakes >= 3)
    return { stage: 'shadowing', reason: 'Pronunciation is your weak spot this week. More shadowing with the native clips will help most.' }
  if (grammarMistakes >= 4)
    return { stage: 'structure', reason: `${grammarMistakes} grammar mistakes this week. Spend more time on the Structure stage and its model sentences.` }
  if (s.callsOrRolePlays === 0)
    return { stage: 'conversation', reason: 'No real or AI conversations this week. Try one role-play or a call: unscripted talking is the goal.' }
  return { stage: 'speak', reason: 'A balanced week. Keep the same plan and push the Speak stage a little longer.' }
}
