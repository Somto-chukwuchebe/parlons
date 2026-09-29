// App-wide constants. Change the name here and it changes everywhere in the UI.
export const APP_NAME = 'Parlons'

/** Language used when nothing is saved yet. Only 'fr' ships in v1. */
export const DEFAULT_LANG = 'fr'

/** Suggested start date in onboarding (today is used instead once this has passed). */
export const DEFAULT_START_DATE = '2026-10-01'

/** Length of the programme, counted from the chosen start date. */
export const PROGRAM_DAYS = 90

/** Number of curriculum weeks. Days after week 12 form the "final stretch". */
export const CURRICULUM_WEEKS = 12

/** Maximum review cards per session, so missed days never pile up. */
export const REVIEW_CAP = { full: 60, short: 25 } as const

/** Remind to back up if the last export is older than this. */
export const BACKUP_REMINDER_DAYS = 7
