import { diffWords, words, wordsPerMinute } from './speech'

describe('pronunciation check comparison', () => {
  it('splits French text into words, handling apostrophes and punctuation', () => {
    expect(words("J'habite à Moscou, depuis trois ans !")).toEqual(["j'", 'habite', 'à', 'moscou', 'depuis', 'trois', 'ans'])
  })

  it('matches a perfect reading, ignoring accents and case', () => {
    const { tokens, score } = diffWords('Vous êtes d’où ?', 'vous etes d où')
    expect(score).toBe(1)
    expect(tokens.every((t) => t.status === 'match')).toBe(true)
  })

  it('marks missed and extra words in order', () => {
    const { tokens, score } = diffWords('Je voudrais un café', 'je voudrai un grand café')
    expect(tokens).toEqual([
      { word: 'je', status: 'match' },
      { word: 'voudrais', status: 'missed' },
      { word: 'voudrai', status: 'extra' },
      { word: 'un', status: 'match' },
      { word: 'grand', status: 'extra' },
      { word: 'café', status: 'match' },
    ])
    expect(score).toBe(0.75)
  })

  it('handles nothing heard', () => {
    const { tokens, score } = diffWords('Bonjour', '')
    expect(tokens).toEqual([{ word: 'bonjour', status: 'missed' }])
    expect(score).toBe(0)
  })

  it('computes words per minute', () => {
    expect(wordsPerMinute('un deux trois quatre cinq six', 3)).toBe(120)
    expect(wordsPerMinute('', 10)).toBeNull()
    expect(wordsPerMinute('bonjour', 0.5)).toBeNull()
  })
})
