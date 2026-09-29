import type { LanguagePack } from '../types'
import { week1, week2, week3, week4 } from './month1'
import { week5, week6, week7, week8 } from './month2'
import { week9, week10, week11, week12 } from './month3'
import {
  benchmarkPrompts,
  drills,
  fluencyCheck,
  frenchTypography,
  mistakeCategories,
  personalScript,
  repairPhrases,
  reviewFlags,
  scenarios,
  selfTalkPrompts,
} from './extras'
import rolePlay from './ai/role-play.md?raw'
import weeklyReview from './ai/weekly-review.md?raw'
import voiceSystem from './ai/voice-system.md?raw'
import audio from './audio.json'

const fr: LanguagePack = {
  code: 'fr',
  name: 'French',
  nativeName: 'Français',
  accent: { light: '#1F4FB8', dark: '#7FA3FF', soft: '#E8EEFB', softDark: '#1B2A4D' },
  speech: {
    locale: 'fr-FR',
    // Best-sounding offline voices first (Apple), then common Android/Chrome/Windows ones.
    preferredVoices: ['Audrey', 'Thomas', 'Aurélie', 'Marie', 'Google français', 'Microsoft Denise', 'Microsoft Julie'],
  },
  weeks: [week1, week2, week3, week4, week5, week6, week7, week8, week9, week10, week11, week12],
  repairPhrases,
  personalScript,
  benchmarkPrompts,
  selfTalkPrompts,
  fluencyCheck,
  drills,
  scenarios,
  mistakeCategories,
  reviewFlags,
  audio: { source: audio.source, clips: audio.clips },
  aiTemplates: { rolePlay, weeklyReview, voiceSystem },
  typography: frenchTypography,
}

export default fr
