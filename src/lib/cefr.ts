// Speaking can-do statements (paraphrased from the CEFR self-assessment grid),
// used in onboarding to estimate a starting point.
export interface CanDoStatement {
  id: string
  level: 'A1' | 'A2' | 'B1'
  text: string
}

export const CEFR_SPEAKING: CanDoStatement[] = [
  { id: 'a1-1', level: 'A1', text: 'I can greet people and say goodbye.' },
  { id: 'a1-2', level: 'A1', text: 'I can say my name, where I live and what I do, in simple phrases.' },
  { id: 'a1-3', level: 'A1', text: 'I can ask and answer very simple questions about familiar things, if people speak slowly.' },
  { id: 'a1-4', level: 'A1', text: 'I can order a drink or buy something using a few words and gestures.' },
  { id: 'a2-1', level: 'A2', text: 'I can describe my daily routine, my job and where I live in a few sentences.' },
  { id: 'a2-2', level: 'A2', text: 'I can say what I did last weekend or on holiday.' },
  { id: 'a2-3', level: 'A2', text: 'I can make, accept and decline invitations and arrange to meet.' },
  { id: 'a2-4', level: 'A2', text: 'I can handle short exchanges in shops, cafés and on public transport.' },
  { id: 'b1-1', level: 'B1', text: 'I can tell a story or describe an experience, linking sentences together.' },
  { id: 'b1-2', level: 'B1', text: 'I can give and briefly explain my opinions and plans.' },
  { id: 'b1-3', level: 'B1', text: 'I can keep a conversation going on familiar topics without preparing it.' },
  { id: 'b1-4', level: 'B1', text: 'I can get by when I don\'t know a word, by describing it or rephrasing.' },
]

/** A level counts as reached when at least 3 of its 4 statements are ticked (and all levels below). */
export function estimateLevel(checked: string[]): 'A0' | 'A1' | 'A2' | 'B1' {
  const has = (lvl: CanDoStatement['level']) =>
    CEFR_SPEAKING.filter((s) => s.level === lvl && checked.includes(s.id)).length >= 3
  if (!has('A1')) return 'A0'
  if (!has('A2')) return 'A1'
  if (!has('B1')) return 'A2'
  return 'B1'
}
