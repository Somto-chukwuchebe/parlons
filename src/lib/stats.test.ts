import { averageRating, speakingSeconds } from './stats'
import { openRound } from '../routes/ThenAndNow'

describe('speaking stats', () => {
  it('adds recordings and logged calls', () => {
    expect(speakingSeconds([{ durationSec: 30 }, { durationSec: 45.5 }], [{ durationMin: 20 }])).toBe(30 + 45.5 + 1200)
  })

  it('averages only the ratings given', () => {
    expect(averageRating([{ ratings: { fluency: 3, accuracy: 4 } }, { ratings: { pronunciation: 5 } }, {}])).toBe(4)
    expect(averageRating([{}])).toBeNull()
  })

  it('opens the right then-and-now round', () => {
    expect([1, 3, 4, 7, 8, 11, 12, 13].map(openRound)).toEqual([1, 1, 4, 4, 8, 8, 12, 12])
  })
})
