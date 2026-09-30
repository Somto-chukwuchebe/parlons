import { render, screen } from '@testing-library/react'
import { db, DEFAULT_SETTINGS } from '../db/schema'
import { App } from './App'

// Regression: on slower devices (iPhone) the app used to decide "no profile → setup"
// before the saved profile had loaded, so every restart showed the setup screen.

beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
  window.scrollTo = () => {}
})

it('opens Today, not setup, when a profile is already saved', async () => {
  await db.settings.put({ ...DEFAULT_SETTINGS })
  await db.profiles.put({
    lang: 'fr',
    startDate: '2026-10-01',
    dailyMinutes: 30,
    studyTime: '07:30',
    ttsRate: 0.9,
    startingCanDo: [],
    startingLevel: 'A1',
    seedApprovedAt: 1,
    onboardedAt: 1,
  })
  // Simulate a phone's slower storage: the profile arrives 300 ms after the app starts.
  const realGet = db.profiles.get.bind(db.profiles)
  vi.spyOn(db.profiles, 'get').mockImplementation(((key: string) =>
    new Promise((r) => setTimeout(() => r(realGet(key)), 300))) as never)
  window.location.hash = '#/'
  render(<App />)
  expect(await screen.findByText(/Station 1 of 12/i, {}, { timeout: 5000 })).toBeInTheDocument()
  expect(screen.queryByText(/Welcome to Parlons/i)).not.toBeInTheDocument()
  expect(window.location.hash).toBe('#/')
})

it('a brand-new user still gets the setup screen', async () => {
  vi.restoreAllMocks()
  await db.profiles.clear()
  await db.settings.clear()
  window.location.hash = '#/'
  render(<App />)
  expect(await screen.findByText(/Welcome to Parlons/i, {}, { timeout: 5000 })).toBeInTheDocument()
})
